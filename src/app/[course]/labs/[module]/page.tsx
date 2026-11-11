import type { Metadata } from "next";
import { LabRunner } from "@/components/lab/LabRunner";
import { getCourses, getModule } from "@/lib/content/server";

export const dynamicParams = false;
export const generateStaticParams = () =>
  getCourses().flatMap((c) => c.modules.filter((m) => m.lab).map((m) => ({ course: c.id, module: m.id })));

type Params = Promise<{ course: string; module: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, module } = await params;
  const m = getModule(course, module);
  return { title: `${m.module.lab?.title ?? "Lab"} · ${m.course.code}` };
}

export default async function LabPage({ params }: { params: Params }) {
  const { course, module } = await params;
  const { course: c, module: m } = getModule(course, module);
  return (
    <LabRunner
      courseId={c.id}
      courseCode={c.code}
      courseTitle={c.title}
      moduleId={m.id}
      moduleTitle={m.title}
      labTitle={m.lab!.title}
      variations={m.lab!.variations}
      exercises={m.coding}
    />
  );
}
