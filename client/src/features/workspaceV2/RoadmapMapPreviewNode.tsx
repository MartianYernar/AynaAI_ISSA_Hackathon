export type RoadmapPreviewStatus = "completed" | "current" | "next" | "locked";

export type RoadmapPreviewStep = {
  id: string;
  label: string;
  description: string;
  status: RoadmapPreviewStatus;
};

export type RoadmapMapPreviewNodeData = {
  title: string;
  steps: RoadmapPreviewStep[];
};

function getOrderedSteps(steps: RoadmapPreviewStep[]) {
  return [...steps];
}

export function RoadmapMapPreviewNode({
  data,
}: {
  data: RoadmapMapPreviewNodeData;
}) {
  const orderedSteps = getOrderedSteps(data.steps);

  return (
    <div className="roadmap-map-preview-node">
      <header>
        <span>Roadmap preview</span>
        <strong>{data.title}</strong>
      </header>

      <div className="roadmap-preview-path" aria-label="Roadmap path preview">
        <svg aria-hidden="true" viewBox="0 0 500 180" preserveAspectRatio="none">
          <path d="M42 126 C126 32 196 150 276 70 S402 48 458 112" />
        </svg>

        {orderedSteps.map((step, index) => (
          <section
            className={`roadmap-preview-step is-${step.status} step-${index + 1}`}
            key={step.id}
          >
            <span>{step.label}</span>
            <p>{step.description}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
