import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Projeto em branco</p>
    </div>
  );
}
