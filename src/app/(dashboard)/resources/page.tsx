import { getResources } from "@/lib/data";
import { getSession } from "@/lib/auth";
import { ResourcesClient } from "@/components/resources/resources-client";

export default async function ResourcesPage() {
  const session = await getSession();
  const allResources = await getResources();
  const canAdd = session?.role === "admin" || session?.role === "trainer";

  return (
    <ResourcesClient
      resources={allResources.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        url: r.url,
        fileType: r.fileType,
      }))}
      canAdd={canAdd}
    />
  );
}
