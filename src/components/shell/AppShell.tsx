"use client";
import { useEffect } from "react";
import { BuddyPanel } from "@/components/buddy/BuddyPanel";
import { ping } from "@/lib/api";
import { useBuddyUi } from "@/lib/buddy";
import type { CourseSummary } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
import { Header } from "./Header";

export function AppShell({ courses, children }: { courses: CourseSummary[]; children: React.ReactNode }) {
  const { open } = useBuddyUi();
  useEffect(() => {
    void ping(); // wake the Render server early — it sleeps when idle
  }, []);
  return (
    <>
      <Header courses={courses} />
      <div className={cn("transition-[padding] duration-300", open && "xl:pr-[420px]")}>
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">{children}</main>
        <footer className="no-print mx-auto max-w-6xl px-4 pb-10 text-xs text-muted sm:px-6">
          StudyRoom — lessons, notes, labs and mock exams with an AI study buddy. Progress is saved in this browser.
        </footer>
      </div>
      <BuddyPanel />
    </>
  );
}
