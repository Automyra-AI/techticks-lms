import { getSession } from "@/lib/auth";
import { getUserById } from "@/lib/data";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) return null;
  const user = await getUserById(session.id);

  return (
    <SettingsClient
      profile={{
        name: user?.name ?? session.name,
        email: user?.email ?? session.email,
        github: user?.github ?? "",
        linkedin: user?.linkedin ?? "",
        phone: user?.phone ?? "",
      }}
    />
  );
}
