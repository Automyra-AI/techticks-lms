import { getSession } from "@/lib/auth";
import { getCertificateProgress } from "@/lib/data";
import { CertificateClient } from "@/components/certificates/certificate-client";

export default async function CertificatesPage() {
  const session = await getSession();
  const { requirements, allMet } = session
    ? await getCertificateProgress(session.id)
    : { requirements: [], allMet: false };

  return (
    <CertificateClient
      studentName={session?.name ?? "Student"}
      requirements={requirements}
      allMet={allMet}
    />
  );
}
