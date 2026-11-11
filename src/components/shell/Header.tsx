"use client";
import { BookOpen, ChevronDown, FlaskConical, GraduationCap, Map as MapIcon, Moon, ScrollText, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";
import { toggleBuddy, useBuddyUi } from "@/lib/buddy";
import type { CourseSummary } from "@/lib/content/schema";
import { streaks, useActivity } from "@/lib/progress";
import { persistentStore, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useBuddyName } from "@/lib/session";
import { AccountMenu } from "./AccountMenu";
import { StatusPill } from "./StatusPill";

const themeStore = persistentStore<"light" | "dark" | null>("studyroom:v3:theme", null);

const NAV = [
  { href: "", label: "Map", icon: MapIcon, match: (p: string) => p === "" },
  { href: "learn", label: "Learn", icon: BookOpen, match: (p: string) => p.startsWith("learn") },
  { href: "labs", label: "Labs", icon: FlaskConical, match: (p: string) => p.startsWith("labs") },
  { href: "exam", label: "Exam", icon: GraduationCap, match: (p: string) => p.startsWith("exam") },
  { href: "guide", label: "Guide", icon: ScrollText, match: (p: string) => p.startsWith("guide") },
];

export function Header({ courses }: { courses: CourseSummary[] }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const course = courses.find((c) => c.id === segments[0]);
  const sub = segments.slice(1).join("/");
  const buddy = useBuddyUi();
  const buddyName = useBuddyName();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <BuddyAvatar size={30} />
          <span className="hidden sm:inline">StudyRoom</span>
        </Link>
        <CourseSwitcher courses={courses} current={course} />
        {course && (
          <nav className="ml-1 hidden items-center gap-0.5 md:flex">
            {NAV.map(({ href, label, icon: Icon, match }) => (
              <Link
                key={label}
                href={`/${course.id}/${href === "learn" ? `learn/${course.firstModule}` : href}${href ? "/" : ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-sunk hover:text-ink",
                  match(sub) && "bg-card text-ink shadow-card",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <StreakChip />
          <StatusPill />
          <ThemeToggle />
          <button
            onClick={toggleBuddy}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full bg-ink pr-3.5 pl-1.5 text-sm font-semibold text-paper transition hover:opacity-90",
              buddy.open && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
            )}
          >
            <span className="grid size-6 place-items-center rounded-full bg-[#FFD84D] text-[13px]">✦</span>
            <span className="hidden max-w-28 truncate sm:inline">{buddyName}</span>
          </button>
          <AccountMenu />
        </div>
      </div>
      {course && (
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-3 py-1.5 md:hidden">
          {NAV.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={label}
              href={`/${course.id}/${href === "learn" ? `learn/${course.firstModule}` : href}${href ? "/" : ""}`}
              className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium text-ink-2", match(sub) && "bg-card text-ink shadow-card")}
            >
              <Icon className="size-3.5" /> {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function CourseSwitcher({ courses, current }: { courses: CourseSummary[]; current?: CourseSummary }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-sm font-semibold"
        aria-expanded={open}
      >
        {current ? (
          <>
            <span className="size-2.5 rounded-full" style={{ background: current.accent }} />
            <span className="font-mono text-xs">{current.code}</span>
            <span className="hidden max-w-36 truncate lg:inline">{current.shortTitle}</span>
          </>
        ) : (
          "Courses"
        )}
        <ChevronDown className="size-3.5 text-muted" />
      </button>
      {open && (
        <div className="absolute top-11 left-0 z-50 w-80 rounded-2xl border border-line bg-card p-1.5 shadow-lift">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/${c.id}/`}
              onClick={() => setOpen(false)}
              className={cn("flex items-start gap-3 rounded-xl p-2.5 hover:bg-sunk", c.id === current?.id && "bg-sunk")}
            >
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: c.accent }} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="block font-mono text-xs text-muted">
                  {c.code} · {c.moduleCount} modules
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StreakChip() {
  const s = streaks(useActivity());
  return (
    <Link
      href="/#streak"
      title={s.studiedToday ? "You studied today — streak safe" : "Study something today to keep your streak"}
      className={cn(
        "hidden h-9 items-center gap-1 rounded-full border border-line bg-card px-3 text-sm font-semibold sm:inline-flex",
        !s.studiedToday && s.current > 0 && "border-warn/40 text-warn",
      )}
    >
      <span aria-hidden className={cn(!s.studiedToday && "opacity-40 grayscale")}>🔥</span>
      <span className="font-mono">{s.current}</span>
    </Link>
  );
}

function ThemeToggle() {
  const theme = useStore(themeStore, null);
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), [theme]);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    themeStore.set(next);
    setDark(next === "dark");
  };
  return (
    <button onClick={flip} className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-sunk" aria-label="Toggle dark mode">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
