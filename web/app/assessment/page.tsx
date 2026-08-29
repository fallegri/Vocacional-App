import AssessmentClient from "@/components/AssessmentClient";

export const metadata = {
  title: "Evaluación Vocacional | OrientApp",
};

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.cohort;
  const cohortParam = Array.isArray(raw) ? raw[0] : raw;
  const cohortCode = cohortParam ? cohortParam.trim().toUpperCase() : null;

  return (
    <main className="container">
      <AssessmentClient cohortCode={cohortCode} />
    </main>
  );
}
