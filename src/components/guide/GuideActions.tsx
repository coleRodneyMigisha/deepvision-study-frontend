"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui";
import { askBuddy, useBuddyPage } from "@/lib/buddy";

export function GuideActions({ courseId, label }: { courseId: string; label: string }) {
  useBuddyPage({ courseId, courseLabel: label, context: { view: "guide" } });
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button variant="primary" onClick={() => window.print()}>
        <Printer className="size-4" /> Print / save as PDF
      </Button>
      <Button onClick={() => askBuddy("Run a rapid-fire revision round across the whole course: 10 quick questions, one at a time.", "quiz")}>
        Rapid-fire revision
      </Button>
    </div>
  );
}
