"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import UserSettings from "./user-settings";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import useChatStore from "@/app/hooks/useChatStore";
import { useSession } from "next-auth/react";

interface SidebarProps {
  isCollapsed: boolean;
  // messages: Message[];
  onClick?: () => void;
  isMobile: boolean;
  chatId: string;
  closeSidebar?: () => void;
}
interface Semester {
  id: number;
  user_id: number;
  nama: number;
}

export function Sidebar({
  isCollapsed,
  isMobile,
  chatId,
  closeSidebar,
}: SidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const user_id = session?.user.id;

  const chats = useChatStore((state) => state.chats);
  const handleDelete = useChatStore((state) => state.handleDelete);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  useEffect(() => {
    const fetchSemesters = async () => {
      if (user_id) {
        const response = await fetch(`/api/v1/semester?user_id=${user_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch semesters");
        }
        const data = await response.json();
        setSemesters(data);
      }
    };
    fetchSemesters();
  }, [user_id]);

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative justify-between group lg:bg-accent/20 lg:dark:bg-card/35 flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <div className=" flex flex-col justify-between p-2 max-h-fit overflow-y-auto">
        <Button
          onClick={() => {
            router.push("/chat");
            if (closeSidebar) {
              closeSidebar();
            }
          }}
          variant="ghost"
          className="flex justify-between w-full h-14 text-sm xl:text-lg font-normal items-center bg-accent/90 dark:bg-secondary/80"
        >
          <div className="flex gap-3 items-center ">
            {!isCollapsed && !isMobile && (
              <Image
                src="/ollama.png"
                alt="AI"
                width={28}
                height={28}
                className=" hidden 2xl:block"
              />
            )}
            Chat Baru
          </div>
          <SquarePen size={18} className="shrink-0 w-4 h-4" />
        </Button>

        <div className="flex flex-col pt-10 gap-2">
          <p className="pl-4 text-xs font-extrabold">Dashboard</p>
          <Suspense fallback>
            <Link
              key={"semester"}
              href={`/dashboard/semester`}
              className={cn(
                {
                  [buttonVariants({ variant: "secondaryLink" })]:
                    chatId.includes("dashboard/semester"),
                  [buttonVariants({ variant: "ghost" })]:
                    !chatId.includes("dashboard/semester"),
                },
                "flex justify-between w-full text-base font-normal items-center "
              )}
            >
              <div className="flex gap-3 items-center truncate">
                <div className="flex flex-col">
                  <span className="text-sm font-normal py-5">Semester</span>
                </div>
              </div>
            </Link>
          </Suspense>
        </div>

        <div className="flex flex-col pt-10 gap-2">
          <p className="pl-4 text-xs font-extrabold">Kartu Rencana Studi</p>
          <Suspense fallback>
            {semesters &&
              semesters.map((semester) => (
                <Link
                  key={semester.id}
                  href={`/krs/semester/${semester.nama}`}
                  className={cn(
                    {
                      [buttonVariants({ variant: "secondaryLink" })]:
                        chatId === `/krs/semester/${semester.nama}`,
                      [buttonVariants({ variant: "ghost" })]:
                        chatId !== `/krs/semester/${semester.nama}`,
                    },
                    "flex justify-between w-full text-base font-normal items-center "
                  )}
                >
                  <div className="flex gap-3 items-center truncate">
                    <div className="flex flex-col">
                      <span className="text-sm font-normal py-5">
                        Semester {semester.nama}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
          </Suspense>
        </div>

        <div className="flex flex-col pt-10 gap-2">
          <p className="pl-4 text-xs font-extrabold">History Chat</p>
          <Suspense fallback>
            {chats ? (
              Object.entries(chats)
                .sort(
                  ([, a], [, b]) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map(([id, chat]) => (
                  <Link
                    key={id}
                    href={`/chat/c/${id}`}
                    className={cn(
                      {
                        [buttonVariants({ variant: "secondaryLink" })]:
                          id === chatId,
                        [buttonVariants({ variant: "ghost" })]: id !== chatId,
                      },
                      "flex justify-between w-full text-base font-normal items-center "
                    )}
                  >
                    <div className="flex gap-3 items-center truncate">
                      <div className="flex flex-col">
                        <span className="text-sm font-normal py-5">
                          {chat.messages.length > 0
                            ? chat.messages[0].content
                            : ""}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex justify-end items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={15} className="shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className=" ">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full flex gap-2 hover:text-red-500 text-red-500 justify-start items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="shrink-0 w-4 h-4" />
                              Delete chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader className="space-y-4">
                              <DialogTitle>Delete chat?</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this chat? This
                                action cannot be undone.
                              </DialogDescription>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline">Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(id);
                                    router.push("/");
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Link>
                ))
            ) : (
              <div className="flex justify-center items-center h-10">
                <span className="text-sm text-muted-foreground">
                  No chats available
                </span>
              </div>
            )}
          </Suspense>
        </div>
      </div>

      <div className="justify-end px-2 py-2 w-full border-t">
        <UserSettings />
      </div>
    </div>
  );
}
