import { LabsIndex } from "@/components/lab/LabsIndex";
import { getOutline } from "@/lib/content/server";

export const metadata = { title: "Labs" };

export default async function LabsPage({ params }: { params: Promise<{ course: string }> }) {
  return <LabsIndex course={getOutline((await params).course)} />;
}
