import AssessmentClient, {
  type MethodOption,
} from "@/components/AssessmentClient";
import { listMethods, normalizeMethodId } from "@/lib/methods/registry";
import type { MethodId } from "@/lib/methods/types";
import { listCohorts } from "@/lib/actions/cohorts";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Evaluación Vocacional | OrientApp",
};

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    cohort?: string | string[];
    method?: string | string[];
  }>;
}) {
  const params = await searchParams;

  const rawCohort = params.cohort;
  const cohortParam = Array.isArray(rawCohort) ? rawCohort[0] : rawCohort;
  const cohortCode = cohortParam ? cohortParam.trim().toUpperCase() : null;

  // Si NO hay cohortCode (usuario individual), se requiere sesión iniciada.
  // Los estudiantes de grupo acceden con cohortCode y pueden tomar el test de
  // forma anónima, sin necesidad de cuenta.
  if (!cohortCode) {
    const user = await getCurrentUser();
    if (!user) {
      const rawMethod = params.method;
      const methodParam = Array.isArray(rawMethod) ? rawMethod[0] : rawMethod;
      const nextPath = methodParam
        ? `/assessment?method=${encodeURIComponent(methodParam)}`
        : "/assessment";
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }

  const rawMethod = params.method;
  const methodParam = Array.isArray(rawMethod) ? rawMethod[0] : rawMethod;

  // Datos serializables de cada método para el componente cliente.
  const methods: MethodOption[] = listMethods().map((m) => ({
    id: m.id,
    name: m.name,
    shortDescription: m.shortDescription,
    scale: m.scale,
    dimensions: m.dimensions,
    questions: m.questions,
  }));

  // Si la cohorte tiene un método asignado, queda fijado (locked) para el
  // usuario. En caso contrario, se respeta el parámetro `method` de la URL o el
  // método por defecto (RIASEC), y el usuario puede elegir.
  let assignedMethodId: MethodId | null = null;
  if (cohortCode) {
    try {
      const cohorts = await listCohorts();
      const match = cohorts.find((c) => c.code === cohortCode);
      if (match?.methodId) {
        assignedMethodId = normalizeMethodId(match.methodId);
      }
    } catch {
      assignedMethodId = null;
    }
  }

  const preselectedMethodId = assignedMethodId
    ? assignedMethodId
    : normalizeMethodId(methodParam);

  return (
    <main className="container">
      <AssessmentClient
        cohortCode={cohortCode}
        methods={methods}
        preselectedMethodId={preselectedMethodId}
        methodLocked={assignedMethodId != null}
      />
    </main>
  );
}
