import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Download, Share2, CheckCircle2 } from "lucide-react";

const requirements = [
  { label: "90% Attendance", met: true },
  { label: "Assignments Completed", met: true },
  { label: "Final Project Approved", met: false },
  { label: "Quiz Passed", met: true },
];

export default function CertificatesPage() {
  const allMet = requirements.every((r) => r.met);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Certificates</h2>
        <p className="text-zinc-400">Earn your AI Automation Mastery certificate</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-zinc-100">
              AI Automation Mastery Certificate
            </h3>
            <p className="mt-2 text-zinc-400">
              Complete all requirements to unlock your certificate
            </p>

            <div className="mt-8 space-y-3 text-left">
              {requirements.map((req) => (
                <div
                  key={req.label}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3"
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${req.met ? "text-emerald-400" : "text-zinc-600"}`}
                  />
                  <span className={req.met ? "text-zinc-200" : "text-zinc-500"}>{req.label}</span>
                  <Badge variant={req.met ? "success" : "default"} className="ml-auto">
                    {req.met ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-3">
              <Button disabled={!allMet}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="secondary" disabled={!allMet}>
                <Share2 className="h-4 w-4" /> Share on LinkedIn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
