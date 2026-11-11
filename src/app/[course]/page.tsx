import type { Metadata } from "next";
import { CourseMap } from "@/components/course/CourseMap";
import { getCourse, getOutline } from "@/lib/content/server";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const c = getCourse((await params).course);
  return { title: `${c.code} · ${c.title}`, description: c.tagline };
}

export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const outline = getOutline((await params).course);
  return <CourseMap course={outline} />;
}
