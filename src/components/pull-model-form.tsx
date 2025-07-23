"use client";

import React from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl, // Add FormControl
} from "@/components/ui/form";
import { Button } from "./ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Input } from "./ui/input";
import { throttle } from "lodash";
import useChatStore from "@/app/hooks/useChatStore";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Silakan pilih model untuk ditarik",
  }),
});

export default function PullModelForm() {
  const {
    isDownloading,
    downloadProgress,
    downloadingModel,
    startDownload,
    stopDownload,
    setDownloadProgress,
  } = useChatStore();

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const handlePullModel = async (data: z.infer<typeof formSchema>) => {
    const modelName = data.name.trim();
    startDownload(modelName);

    const throttledSetProgress = throttle((progress: number) => {
      setDownloadProgress(progress);
    }, 200);

    let lastStatus: string | null = null;

    try {
      const response = await fetch("/api/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error("Respon jaringan tidak baik");
      }

      if (!response.body) {
        throw new Error("Terjadi kesalahan");
      }

      await processStream(response.body, throttledSetProgress, lastStatus);

      toast.success("Model berhasil ditarik");
      router.refresh();
    } catch (error) {
      toast.error(
        `Kesalahan: ${
          error instanceof Error ? error.message : "Gagal menarik model"
        }`
      );
    } finally {
      stopDownload();
      throttledSetProgress.cancel();
    }
  };

  const processStream = async (
    body: ReadableStream<Uint8Array>,
    throttledSetProgress: (progress: number) => void,
    lastStatus: string | null
  ) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const jsonObjects = text.trim().split("\n");

      for (const jsonObject of jsonObjects) {
        try {
          const responseJson = JSON.parse(jsonObject);

          if (responseJson.error) {
            throw new Error(responseJson.error);
          }

          if (
            responseJson.completed !== undefined &&
            responseJson.total !== undefined
          ) {
            const progress =
              (responseJson.completed / responseJson.total) * 100;
            throttledSetProgress(progress);
          }

          if (responseJson.status && responseJson.status !== lastStatus) {
            toast.info(`Status: ${responseJson.status}`);
            lastStatus = responseJson.status;
          }
        } catch (error) {
          throw new Error("Kesalahan parsing JSON");
        }
      }
    }
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    handlePullModel(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Model</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="llama2"
                  value={field.value || ""}
                />
              </FormControl>
              <p className="text-xs pt-1">
                Periksa{" "}
                <a
                  href="https://ollama.com/library"
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  perpustakaan
                </a>{" "}
                untuk daftar model yang tersedia.
              </p>
              <FormMessage />
              <div className="space-y-2 w-full">
                <Button
                  type="submit"
                  className="w-full "
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <div className="flex items-center gap-2">
                      <Loader2Icon className="animate-spin w-4 h-4" />
                      <span>
                        Menarik {downloadingModel}...{" "}
                        {downloadProgress.toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    "Tarik Model"
                  )}
                </Button>
                <p className="text-xs text-center">
                  {isDownloading
                    ? "This may take a while. You can safely close this modal and continue using the app."
                    : "Pressing the button will download the specified model to your device."}
                </p>
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
