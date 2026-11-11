"use client";
import { api, type Evaluation } from "./api";

export interface GradeArgs {
  courseId: string;
  moduleId?: string | null;
  question: string;
  answer: string;
  keywords: string[];
  idealAnswer: string;
  kind?: "oral" | "written" | "lab";
}

/** Grade with the AI examiner; fall back to a keyword check when the server is unreachable. */
export async function gradeAnswer(a: GradeArgs): Promise<Evaluation> {
  try {
    return await api.grade({
      course_id: a.courseId,
      module_id: a.moduleId ?? null,
      question: a.question,
      answer: a.answer,
      keywords: a.keywords,
      ideal_answer: a.idealAnswer,
      kind: a.kind ?? "oral",
    });
  } catch {
    return localGrade(a);
  }
}

export function localGrade({ answer, keywords, idealAnswer }: GradeArgs): Evaluation {
  const lower = answer.toLowerCase();
  const used = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const missed = keywords.filter((k) => !used.includes(k));
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  let score = keywords.length ? Math.round(100 * Math.min(1, used.length / Math.max(3, keywords.length * 0.55))) : Math.min(100, words * 2);
  if (words < 15) score = Math.min(score, 45);
  score = Math.max(answer.trim() ? 10 : 0, score);
  return {
    score,
    grade_label: score >= 80 ? "Strong" : score >= 60 ? "Solid pass" : score >= 40 ? "Needs polish" : "Not there yet",
    beats: {
      claim: words >= 15 ? "Check your first sentence states the idea directly." : "Too short — aim for 3–5 sentences.",
      mechanism: used.length >= 3 ? "You used several of the expected technical terms." : "Explain how it works using the course vocabulary.",
      tradeoff: "Finish with a limitation, failure mode or trade-off.",
    },
    terms_used: used,
    terms_missed: missed.slice(0, 6),
    feedback: "Offline keyword check — the AI examiner couldn't be reached. Compare with the model answer below.",
    model_answer: idealAnswer,
    examiner_tip: "Answer in three beats: claim, mechanism, trade-off.",
    next_step: missed.length ? `Define these in one line each: ${missed.slice(0, 3).join(", ")}.` : "",
    source: "heuristic",
  };
}
