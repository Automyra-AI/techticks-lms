import { getAllCourses } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { CreateCourseButton } from "@/components/courses/create-course";
import { BookOpen, Users, Clock } from "lucide-react";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await getSession();
  const allCourses = await getAllCourses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Courses</h2>
          <p className="text-zinc-400">Manage and explore courses</p>
        </div>
        {(session?.role === "admin" || session?.role === "trainer") && <CreateCourseButton />}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allCourses.map((course) => (
          <Card key={course.id} className="group hover:border-violet-500/30 transition-colors">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20">
                <BookOpen className="h-6 w-6 text-violet-400" />
              </div>
              <CardTitle className="mt-4">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{course.status}</Badge>
                {course.price ? <Badge>${course.price}</Badge> : null}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> 24 students
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> 12 weeks
                </span>
              </div>
              <ProgressBar value={72} className="mt-4" />
              <Link href="/roadmap">
                <Button variant="secondary" className="mt-4 w-full">
                  View Roadmap
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
