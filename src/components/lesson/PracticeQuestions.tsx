"use client";
import { Badge, Card } from "@/components/ui";
import { WrittenAnswer } from "@/components/practice/WrittenAnswer";
import type { Question } from "@/lib/content/schema";
import { updateModule, useCourseProgress } from "@/lib/progress";

export function PracticeQuestions({ courseId, moduleId, questions }: { courseId: string; moduleId: string; questions: Question[] }) {
  const best = useCourseProgress(courseId).modules[moduleId]?.questions ?? {};
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <Card key={q.question} className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{q.kind === "long" ? "Long answer" : "Short answer"}</Badge>
            <Badge>{q.marks} marks</Badge>
            {best[i] != null && <Badge tone={best[i] >= 60 ? "good" : "warn"}>Best {best[i]}%</Badge>}
          </div>
          <p className="mt-3 font-display text-lg leading-snug font-medium">{q.question}</p>
          <div className="mt-3">
            <WrittenAnswer
              draftKey={`${courseId}/${moduleId}/q${i}`}
              courseId={courseId}
              moduleId={moduleId}
              question={q.question}
              keywords={q.keywords}
              idealAnswer={q.idealAnswer}
              kind="written"
              placeholder={q.kind === "long" ? "Plan in bullet points first, then write it out. Aim for the marks shown." : undefined}
              onGraded={(r) =>
                updateModule(courseId, moduleId, (m) => ({ ...m, questions: { ...(m.questions ?? {}), [i]: Math.max(m.questions?.[i] ?? 0, r.score) } }))
              }
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
