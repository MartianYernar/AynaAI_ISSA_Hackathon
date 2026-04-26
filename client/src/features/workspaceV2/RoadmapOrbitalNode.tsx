import type { ElementType } from "react";
import { CheckCircle2, CircleDot, Flag, Lock } from "lucide-react";
import RadialOrbitalTimeline from "../../components/ui/radial-orbital-timeline";

type RoadmapStepStatus = "completed" | "current" | "next" | "locked";

type RoadmapStep = {
  id: string;
  label: string;
  stage: string;
  status: RoadmapStepStatus;
  description?: string;
};

type RoadmapLink = {
  source: string;
  target: string;
};

type RoadmapMapData = {
  steps: RoadmapStep[];
  links: RoadmapLink[];
};

type OrbitalTimelineItem = {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
};

const statusAdapters: Record<
  RoadmapStepStatus,
  Pick<OrbitalTimelineItem, "icon" | "status" | "energy">
> = {
  completed: {
    energy: 92,
    icon: CheckCircle2,
    status: "completed",
  },
  current: {
    energy: 100,
    icon: CircleDot,
    status: "in-progress",
  },
  next: {
    energy: 74,
    icon: Flag,
    status: "pending",
  },
  locked: {
    energy: 42,
    icon: Lock,
    status: "pending",
  },
};

function getRelatedIds(
  stepId: string,
  links: RoadmapLink[],
  numericIdByStepId: Map<string, number>,
) {
  return links
    .filter((link) => link.source === stepId || link.target === stepId)
    .map((link) =>
      numericIdByStepId.get(link.source === stepId ? link.target : link.source),
    )
    .filter((id): id is number => typeof id === "number");
}

function toOrbitalTimelineData(data: RoadmapMapData): OrbitalTimelineItem[] {
  const numericIdByStepId = new Map(
    data.steps.map((step, index) => [step.id, index + 1]),
  );

  return data.steps.map((step) => {
    const statusAdapter = statusAdapters[step.status];

    return {
      category: step.status,
      content: step.description ?? `${step.stage}: ${step.label}`,
      date: step.stage,
      id: numericIdByStepId.get(step.id) ?? 0,
      relatedIds: getRelatedIds(step.id, data.links, numericIdByStepId),
      title: step.label,
      ...statusAdapter,
    };
  });
}

export function RoadmapOrbitalNode({ data }: { data: RoadmapMapData }) {
  const timelineData = toOrbitalTimelineData(data);

  return (
    <div className="v2-roadmap-orbital" aria-label="Visual roadmap map">
      <RadialOrbitalTimeline timelineData={timelineData} />
    </div>
  );
}
