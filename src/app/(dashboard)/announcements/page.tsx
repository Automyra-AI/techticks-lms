import { getAnnouncements } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { CreateAnnouncementButton } from "@/components/announcements/create-announcement";
import { Megaphone } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSession } from "@/lib/auth";

export default async function AnnouncementsPage() {
  const session = await getSession();
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Announcements</h2>
          <p className="text-zinc-400">Course updates and important notices</p>
        </div>
        {(session?.role === "admin" || session?.role === "trainer") && <CreateAnnouncementButton />}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                  <Megaphone className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100">{announcement.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{announcement.content}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {formatDate(announcement.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
