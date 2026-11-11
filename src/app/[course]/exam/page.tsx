import { ExamView } from "@/components/exam/ExamView";
import { getExamBank } from "@/lib/content/server";

export const metadata = { title: "Mock exam" };

export default async function ExamPage({ params }: { params: Promise<{ course: string }> }) {
  return <ExamView bank={getExamBank((await params).course)} />;
}
