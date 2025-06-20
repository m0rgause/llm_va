"use client";

import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import { Attachment, ChatRequestOptions, generateId } from "ai";
import { Message, useChat } from "ai/react";
import React, { useEffect, useRef, useState } from "react";
import useChatStore from "@/app/hooks/useChatStore";
import { useRouter } from "next/navigation";
import Image from "next/image";

export interface ChatProps {
  id: string;
  initialMessages: Message[] | [];
  isMobile?: boolean;
}

export default function Chat({ initialMessages, id, isMobile }: ChatProps) {
  const controllerRef = useRef<AbortController | null>(null);
  // Ref to store the timeout ID for cleanup
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null); // <--- NEW REF

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    setInput,
    reload,
    error: chatError, // Rename to avoid conflict with local `error` state
  } = useChat({
    id,
    initialMessages,
    fetch: async (input, init) => {
      // Clear any previous timeout before starting a new fetch
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }

      controllerRef.current = new AbortController();

      // === THE TIMEOUT CHANGE IS HERE ===
      // Set the desired timeout duration in milliseconds
      const desiredFetchTimeoutMs = 320000; // 120 seconds (2 minutes)
      // Or even higher, e.g., 180000 (3 minutes) if you really want to test limits

      fetchTimeoutRef.current = setTimeout(() => {
        // If the timeout triggers, abort the fetch request
        console.warn(
          `[Custom Fetch Timeout] Aborting fetch after ${
            desiredFetchTimeoutMs / 1000
          } seconds.`
        );
        controllerRef.current?.abort(); // Use optional chaining for safety
      }, desiredFetchTimeoutMs);

      try {
        const response = await fetch(input, {
          ...init,
          signal: controllerRef.current.signal, // This signal will now be controlled by our custom timeout too
          keepalive: true,
        });
        return response;
      } catch (e: any) {
        // Catch errors from fetch itself (like AbortError)
        console.error("Fetch was aborted by custom timeout or user stop.");
        if (e.name === "AbortError") {
          // You might want to throw a specific error that useChat's onError can catch
          throw new Error("Chat request timed out locally or was cancelled.", {
            cause: "CLIENT_TIMEOUT",
          });
        }
        throw e; // Re-throw other errors
      } finally {
        // Always clear the timeout when fetch promise settles (success or error)
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = null;
        }
      }
    },
    onResponse: (response) => {
      // Clear the timeout as soon as the first byte of response is received
      // (or when response headers are available). This is good for streaming.
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onFinish: (message) => {
      // Clear timeout again just to be safe, though onResponse should handle it
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      const savedMessages = getMessagesById(id);
      saveMessages(id, [...savedMessages, message]);
      setLoadingSubmit(false);
      router.replace(`/chat/c/${id}`);
    },
    onError: (error) => {
      // Clear timeout on any error
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      setLoadingSubmit(false);
      // router.replace("/"); // Consider if you always want to redirect on error
      console.error("AI SDK Error:", error.message);
      console.error("AI SDK Error Cause:", error.cause);
      console.error(error);

      // Set a custom error message for the UI if it was our timeout
      if (error.cause === "CLIENT_TIMEOUT") {
        setCustomUiError(
          "Response took too long and was aborted by the client."
        );
      } else {
        setCustomUiError(`An error occurred: ${error.message}`);
      }
    },
  });

  const [loadingSubmit, setLoadingSubmit] = React.useState(false);
  const [customUiError, setCustomUiError] = useState<string | null>(null); // <--- NEW STATE for custom error messages
  const formRef = useRef<HTMLFormElement>(null);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const saveMessages = useChatStore((state) => state.saveMessages);
  const getMessagesById = useChatStore((state) => state.getMessagesById);
  const router = useRouter();

  // Reset custom error when input changes or a new submission starts
  useEffect(() => {
    if (input || isLoading) {
      setCustomUiError(null);
    }
  }, [input, isLoading]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    window.history.replaceState({}, "", `/chat/c/${id}`);

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
    };

    setLoadingSubmit(true); // Indicate submission is loading
    setCustomUiError(null); // Clear any previous errors

    const attachments: Attachment[] = base64Images
      ? base64Images.map((image) => ({
          contentType: "image/base64",
          url: image,
        }))
      : [];

    const requestOptions: ChatRequestOptions = {
      body: {
        selectedModel: selectedModel,
        // retrievedContent: retrievedContent, // Menyisipkan hasil retrieval ke request API (this is on server)
      },
      ...(base64Images && {
        data: {
          images: base64Images,
        },
        experimental_attachments: attachments,
      }),
    };

    handleSubmit(e, requestOptions);
    saveMessages(id, [...messages, userMessage]);
    setBase64Images(null);
  };

  const removeLatestMessage = () => {
    const updatedMessages = messages.slice(0, -1);
    setMessages(updatedMessages);
    saveMessages(id, updatedMessages);
    return updatedMessages;
  };

  const handleStop = () => {
    stop();
    // When manually stopped, also clear the custom fetch timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
    // abort the ongoing fetch request
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null; // Clear the controller reference
    }
    saveMessages(id, [...messages]);
    setLoadingSubmit(false);
    setCustomUiError("Chat stopped by user."); // Indicate user stop
  };

  return (
    <div className="flex flex-col w-full max-w-3xl h-full">
      <ChatTopbar
        isLoading={isLoading}
        chatId={id}
        messages={messages}
        setMessages={setMessages}
      />

      {messages.length === 0 ? (
        <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
          <Image
            src="/ollama.png"
            alt="AI"
            width={40}
            height={40}
            className="h-16 w-14 object-contain dark:invert"
          />
          <p className="text-center text-base text-muted-foreground">
            How can I help you today?
          </p>
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
            // base64Images={base64Images}
            // setBase64Images={setBase64Images}
          />
        </div>
      ) : (
        <>
          <ChatList
            messages={messages}
            isLoading={isLoading}
            loadingSubmit={loadingSubmit}
            // error={chatError || customUiError} // Pass error from useChat or custom UI error
            reload={async () => {
              removeLatestMessage();
              const requestOptions: ChatRequestOptions = {
                body: { selectedModel: selectedModel },
              };
              setLoadingSubmit(true);
              setCustomUiError(null); // Clear errors on reload attempt
              return reload(requestOptions);
            }}
          />
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={onSubmit}
            isLoading={isLoading}
            stop={handleStop}
            setInput={setInput}
            // base64Images={base64Images}
            // setBase64Images={setBase64Images}
          />
        </>
      )}
    </div>
  );
}
