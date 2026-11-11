"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Onboarding } from "@/components/auth/Onboarding";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { BuddyPanel } from "@/components/buddy/BuddyPanel";
import { ping } from "@/lib/api";
import { refreshMe } from "@/lib/auth";
import { useBuddyUi } from "@/lib/buddy";
import type { CourseSummary } from "@/lib/content/schema";
import { sessionStore, useSession } from "@/lib/session";
import { startSync } from "@/lib/sync";
import { cn } from "@/lib/utils";
import { Header } from "./Header";

/**
 * Every page sits behind sign-in: signed out → the welcome/sign-in screen, signed in without a
 * buddy name → onboarding, otherwise the app. `/auth/` (emailed links) is always reachable.
 */
export function AppShell({ courses, children }: { courses: CourseSummary[]; children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const userId = session?.user.id;

  useEffect(() => {
    setHydrated(true);
    void ping(); // wake the Render server early — it sleeps when idle
  }, []);

  useEffect(() => {
    if (!userId) return;
    const user = sessionStore.get()?.user;
    if (user) void startSync(user);
    void refreshMe();
  }, [userId]);

  if (!hydrated) return <Splash />;
  if (pathname.startsWith("/auth")) return <>{children}</>;
  if (!session) return <AuthScreen courses={courses} />;
  if (!session.user.buddy_name) return <Onboarding user={session.user} />;
  return <Shell courses={courses}>{children}</Shell>;
}

function Shell({ courses, children }: { courses: CourseSummary[]; children: React.ReactNode }) {
  const { open } = useBuddyUi();
  return (
    <>
      <Header courses={courses} />
      <div className={cn("transition-[padding] duration-300", open && "xl:pr-[420px]")}>
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6">{children}</main>
        <footer className="no-print mx-auto max-w-6xl px-4 pb-10 text-xs text-muted sm:px-6">
          StudyRoom — lessons, notes, labs and mock exams with an AI study buddy. Progress is saved to your account.
        </footer>
      </div>
      <BuddyPanel />
    </>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <BuddyAvatar size={64} />
    </div>
  );
}
