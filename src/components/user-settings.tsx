"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { GearIcon, ExitIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { set } from "zod";
import UsernameForm from "./username-form";
import EditUsernameForm from "./edit-username-form";
import PullModel from "./pull-model";
import useChatStore from "@/app/hooks/useChatStore";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

export default function UserSettings() {
  const [open, setOpen] = useState(false);

  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Skeleton className="w-10 h-10 rounded-full" />
        <Skeleton className="w-32 h-4 rounded-full ml-2" />
      </div>
    );
  }

  const userName = session?.user.nama || "AI";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex justify-start gap-3 w-full h-14 text-base font-normal items-center "
        >
          <Avatar className="flex justify-start items-center overflow-hidden">
            <AvatarImage
              src=""
              alt="AI"
              width={4}
              height={4}
              className="object-contain"
            />
            <AvatarFallback>
              {userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs truncate">
            <p>{userName}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-2">
        <Dialog>
          <DialogTrigger className="w-full">
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex w-full gap-2 p-1 items-center cursor-pointer">
                <GearIcon className="w-4 h-4" />
                Pengaturan
              </div>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="space-y-4">
              <DialogTitle>Pengaturan</DialogTitle>
              <EditUsernameForm setOpen={setOpen} />
            </DialogHeader>
          </DialogContent>
          {/* logout */}
          <DropdownMenuItem className="w-full">
            <div
              className="flex w-full gap-2 p-1 items-center cursor-pointer hover:bg-accent"
              onClick={() => {
                signOut();
              }}
            >
              <ExitIcon className="w-4 h-4" />
              Keluar
            </div>
          </DropdownMenuItem>
        </Dialog>
        <Dialog></Dialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
