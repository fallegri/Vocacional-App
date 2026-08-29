import TutorChatClient from "@/components/TutorChatClient";

export const metadata = {
  title: "Tutor IA | OrientApp",
};

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function TutorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params?.session ?? null;

  return (
    <main className="container">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 4 }}>Tutor Vocacional IA</h1>
        <p className="muted" style={{ marginTop: 0 }}>
          Conversa con el Tutor IA sobre tus resultados, carreras y decisiones
          vocacionales. Las respuestas se fundamentan en la base de conocimiento
          (libros e investigaciones) cuando hay fuentes relevantes.
        </p>
      </div>
      <TutorChatClient sessionId={sessionId} />
    </main>
  );
}
