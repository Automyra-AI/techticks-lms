import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar, Header } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar user={session} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
