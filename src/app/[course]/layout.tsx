import { CourseScope } from "@/components/course/CourseScope";
import { courseParams, getOutline } from "@/lib/content/server";

export const dynamicParams = false;
export const generateStaticParams = courseParams;

export default async function CourseLayout({ children, params }: { children: React.ReactNode; params: Promise<{ course: string }> }) {
  const { course } = await params;
  const outline = getOutline(course);
  return (
    <div style={{ ["--accent" as string]: outline.accent }}>
      <CourseScope courseId={outline.id} moduleIds={outline.modules.map((m) => m.id)} />
      {children}
    </div>
  );
}
