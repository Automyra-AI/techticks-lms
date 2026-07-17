"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Download, Share2, CheckCircle2 } from "lucide-react";

type Requirement = { label: string; met: boolean; detail?: string };

const COURSE = "AI Automation Mastery";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : "https://techticks.academy");

export function CertificateClient({
  studentName,
  requirements,
  allMet,
}: {
  studentName: string;
  requirements: Requirement[];
  allMet: boolean;
}) {
  const issuedOn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  function downloadCertificate() {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${COURSE} — Certificate</title>
      <style>
        *{margin:0;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif}
        body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a}
        .cert{width:1000px;max-width:96vw;padding:64px;background:linear-gradient(135deg,#faf7ff,#fff);
          border:12px solid #7c3aed;border-radius:16px;text-align:center;color:#1a1a2e}
        .badge{font-size:56px}
        .kicker{letter-spacing:6px;text-transform:uppercase;color:#7c3aed;font-size:14px;margin:24px 0 8px}
        h1{font-size:40px;margin:8px 0 24px}
        .name{font-size:52px;color:#5b21b6;border-bottom:2px solid #c4b5fd;display:inline-block;padding:0 24px 8px;margin:16px 0}
        .course{font-size:26px;margin-top:24px;font-weight:bold}
        .meta{margin-top:40px;display:flex;justify-content:space-between;font-size:14px;color:#555}
        @media print{body{background:#fff}.cert{border-color:#7c3aed}}
      </style></head><body>
      <div class="cert">
        <div class="badge">🎓</div>
        <div class="kicker">TechTicks AI Automation Academy</div>
        <h1>Certificate of Completion</h1>
        <p>This is proudly presented to</p>
        <div class="name">${studentName}</div>
        <p>for successfully completing the course</p>
        <div class="course">${COURSE}</div>
        <div class="meta"><span>Issued: ${issuedOn}</span><span>${APP_URL}</span></div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
      </body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      alert("Please allow pop-ups to download your certificate.");
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  function shareOnLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(APP_URL)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Certificates</h2>
        <p className="text-zinc-400">Earn your {COURSE} certificate</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-zinc-100">{COURSE} Certificate</h3>
            <p className="mt-2 text-zinc-400">Complete all requirements to unlock your certificate</p>

            <div className="mt-8 space-y-3 text-left">
              {requirements.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No certificate progress to show.</p>
              ) : (
                requirements.map((req) => (
                  <div key={req.label} className="flex items-center gap-3 rounded-lg border border-zinc-800 p-3">
                    <CheckCircle2 className={`h-5 w-5 shrink-0 ${req.met ? "text-emerald-400" : "text-zinc-600"}`} />
                    <div className="min-w-0">
                      <span className={req.met ? "text-zinc-200" : "text-zinc-500"}>{req.label}</span>
                      {req.detail && <span className="ml-2 text-xs text-zinc-500">({req.detail})</span>}
                    </div>
                    <Badge variant={req.met ? "success" : "default"} className="ml-auto shrink-0">
                      {req.met ? "Done" : "Pending"}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <p className="mt-4 text-xs text-amber-400">
              {allMet
                ? "All requirements met — your verified certificate is ready to download."
                : "The certificate unlocks once every requirement above is met."}
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={downloadCertificate} disabled={!allMet}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="secondary" onClick={shareOnLinkedIn} disabled={!allMet}>
                <Share2 className="h-4 w-4" /> Share on LinkedIn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
