import { getSession } from "@/lib/auth";
import { CertificateClient } from "@/components/certificates/certificate-client";

export default async function CertificatesPage() {
  const session = await getSession();
  return <CertificateClient studentName={session?.name ?? "Student"} />;
}
