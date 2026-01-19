import { notFound } from "next/navigation";
import { api, HydrateClient } from "~/trpc/server";
import { ProjectView } from "./project-view";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const project = await api.project.getById({ id });

  if (!project) {
    notFound();
  }

  return (
    <HydrateClient>
      <ProjectView initialProject={project} />
    </HydrateClient>
  );
}
