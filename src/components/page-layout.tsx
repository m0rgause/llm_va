"use client";

import { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SidebarAdministrator } from "./sidebarAdministrator";

export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const defaultLayout = [30, 160];
  const defaultCollapsed = false;
  const navCollapsedSize = 10;
  const path = pathname;
  // splitting pathname
  const pathParts = path.split("/");

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 1023);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const handleCloseSidebar = () => {
    setSheetOpen(false);
  };

  return (
    <main className="h-screen items-stretch">
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`;
        }}
        className="h-screen items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={isMobile ? 0 : 12}
          maxSize={isMobile ? 0 : 16}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              true
            )}`;
          }}
          onExpand={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              false
            )}`;
          }}
          className={cn(
            isCollapsed
              ? "min-w-[50px] md:min-w-[70px] transition-all duration-300 ease-in-out"
              : "hidden md:block"
          )}
        >
          {session?.user.role === "administrator" &&
          pathParts[1] === "administrator" ? (
            <SidebarAdministrator
              isCollapsed={isCollapsed || isMobile}
              // messages={initialMessages}
              isMobile={isMobile}
              chatId={path}
              closeSidebar={handleCloseSidebar}
            />
          ) : (
            <Sidebar
              isCollapsed={isCollapsed || isMobile}
              // messages={initialMessages}
              isMobile={isMobile}
              chatId={path}
              closeSidebar={handleCloseSidebar}
            />
          )}
          {/* <Sidebar
            isCollapsed={isCollapsed || isMobile}
            // messages={initialMessages}
            isMobile={isMobile}
            chatId={path}
          /> */}
        </ResizablePanel>
        <ResizableHandle className={cn("hidden md:flex")} withHandle />
        <ResizablePanel
          defaultSize={defaultLayout[1]}
          className="overflow-hidden"
          minSize={0}
        >
          <div className={cn("h-full w-full overflow-y-auto p-6", className)}>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger>
                <HamburgerMenuIcon className="lg:hidden w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left">
                <Sidebar
                  chatId={""}
                  isCollapsed={false}
                  isMobile={false}
                  closeSidebar={handleCloseSidebar}
                />
              </SheetContent>
            </Sheet>
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
