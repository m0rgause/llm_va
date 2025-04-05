"use client";

import { useEffect, useState } from "react";
import { ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const defaultLayout = [30, 160];
  const defaultCollapsed = false;
  const navCollapsedSize = 10;
  const path = "semester";

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center">
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
          <Sidebar
            isCollapsed={isCollapsed || isMobile}
            // messages={initialMessages}
            isMobile={isMobile}
            chatId={path}
          />
        </ResizablePanel>
        <ResizablePanel className="overflow-hidden" minSize={0}>
          <div className={cn("h-full overflow-y-auto", className)}>
            {children}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
