import type { Metadata } from "next";
import { LessonView } from "@/components/lesson/LessonView";
import { getModule, getOutline, moduleParams } from "@/lib/content/server";

export const dynamicParams = false;
export const generateStaticParams = moduleParams;

type Params = Promise<{ course: string; module: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { course, module } = await params;
  const m = getModule(course, module);
  return { title: `${m.module.title} · ${m.course.code}`, description: m.module.subtitle };
}

export default async function LearnPage({ params }: { params: Params }) {
  const { course, module } = await params;
  const { module: mod, index } = getModule(course, module);
  return <LessonView course={getOutline(course)} module={mod} index={index} />;
}
