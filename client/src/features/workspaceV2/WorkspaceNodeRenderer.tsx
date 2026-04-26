import { Minus, Volume2, X } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { ReactNode } from "react";
import { speakAyana, stopAyanaSpeech } from "./ayanaSpeech";
import { AchievementAdviceNode } from "./AchievementAdviceNode";
import { AchievementReviewNode } from "./AchievementReviewNode";
import { AchievementRubricNode } from "./AchievementRubricNode";
import { AdmissionProbabilityNode } from "./AdmissionProbabilityNode";
import { CareerIdentityNode } from "./CareerIdentityNode";
import { GeminiIslandNode } from "./GeminiIslandNode";
import { InterestSignalNode } from "./InterestSignalNode";
import { RoadmapMapPreviewNode } from "./RoadmapMapPreviewNode";
import { RoadmapOrbitalNode } from "./RoadmapOrbitalNode";
import { getSpeakableTextForNode } from "./speakableNodeText";
import type { WorkspaceNodeSchema } from "./types";

type RendererProps = NodeProps & {
  data: WorkspaceNodeSchema["data"] & {
    workspaceNode: WorkspaceNodeSchema;
    onMinimize: (id: string) => void;
    onHide: (id: string) => void;
  };
};

function NodeChrome({ children, data }: RendererProps & { children: ReactNode }) {
  const workspaceNode = data.workspaceNode;
  const speakableText = getSpeakableTextForNode(workspaceNode);
  const canSpeak = speakableText.trim().length > 2;

  return (
    <article
      className={`workspace-v2-node node-${workspaceNode.type} ${
        workspaceNode.state === "minimized" ? "is-minimized" : ""
      }`}
      style={{
        width: workspaceNode.size.width,
        minHeight:
          workspaceNode.state === "minimized" ? 76 : workspaceNode.size.height,
      }}
    >
      <header className="workspace-v2-node-header">
        <h2>{workspaceNode.title}</h2>
        <div className="workspace-v2-node-controls">
          {canSpeak ? (
            <button
              aria-label={`Have Ayana read aloud: ${workspaceNode.title}`}
              className="workspace-v2-node-speak"
              onClick={() => speakAyana(speakableText)}
              onPointerDown={(e) => e.stopPropagation()}
              title="Read aloud with Ayana’s voice"
              type="button"
            >
              <Volume2 size={13} strokeWidth={1.9} />
            </button>
          ) : null}
          <button
            aria-label={`Minimize ${workspaceNode.title}`}
            onClick={() => data.onMinimize(workspaceNode.id)}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <Minus size={13} strokeWidth={1.9} />
          </button>
          <button
            aria-label={`Hide ${workspaceNode.title}`}
            onClick={() => {
              stopAyanaSpeech();
              data.onHide(workspaceNode.id);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            type="button"
          >
            <X size={13} strokeWidth={1.9} />
          </button>
        </div>
      </header>
      {workspaceNode.state === "minimized" ? null : children}
    </article>
  );
}

export function WorkspaceNodeRenderer(props: RendererProps) {
  const workspaceNode = props.data.workspaceNode;
  const nodeData = workspaceNode.data as any;

  if (workspaceNode.type === "profile-summary") {
    return (
      <NodeChrome {...props}>
        <div className="v2-profile-body">
          <strong>{nodeData.name}</strong>
          <span>
            {nodeData.gradeOrAge} · {nodeData.region} · {nodeData.englishLevel}
          </span>
          <ul>
            {nodeData.focus.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "interest-chart") {
    return (
      <NodeChrome {...props}>
        <div className="v2-interest-chart">
          {nodeData.interests.map((item: { label: string; score: number }) => (
            <section key={item.label}>
              <div>
                <span>{item.label}</span>
                <b>{item.score}%</b>
              </div>
              <i>
                <em style={{ width: `${item.score}%` }} />
              </i>
            </section>
          ))}
        </div>
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "career-identity") {
    return (
      <NodeChrome {...props}>
        <CareerIdentityNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "interest-signal") {
    return (
      <NodeChrome {...props}>
        <InterestSignalNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "roadmap-map-preview") {
    return (
      <NodeChrome {...props}>
        <RoadmapMapPreviewNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "career-table") {
    return (
      <NodeChrome {...props}>
        <div className="v2-career-table">
          {nodeData.rows.map(
            (row: { role: string; fit: number; signal: string }) => (
              <section key={row.role}>
                <strong>{row.role}</strong>
                <b>{row.fit}%</b>
                <p>{row.signal}</p>
              </section>
            ),
          )}
        </div>
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "roadmap-timeline") {
    return (
      <NodeChrome {...props}>
        <div className="v2-roadmap">
          {nodeData.milestones.map(
            (milestone: { phase: string; title: string; detail: string }) => (
              <section key={milestone.phase}>
                <span>{milestone.phase}</span>
                <strong>{milestone.title}</strong>
                <p>{milestone.detail}</p>
              </section>
            ),
          )}
        </div>
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "roadmap-map") {
    return (
      <NodeChrome {...props}>
        <RoadmapOrbitalNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "achievement-evidence") {
    return (
      <NodeChrome {...props}>
        <div className="v2-evidence">
          {nodeData.items.map((item: { source: string; evidence: string }) => (
            <section key={item.source}>
              <span>{item.source}</span>
              <p>{item.evidence}</p>
            </section>
          ))}
        </div>
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "gemini-island") {
    return (
      <NodeChrome {...props}>
        <GeminiIslandNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "admission-probability") {
    return (
      <NodeChrome {...props}>
        <AdmissionProbabilityNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "achievement-review") {
    return (
      <NodeChrome {...props}>
        <AchievementReviewNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "achievement-rubric") {
    return (
      <NodeChrome {...props}>
        <AchievementRubricNode data={nodeData} />
      </NodeChrome>
    );
  }

  if (workspaceNode.type === "achievement-advice") {
    return (
      <NodeChrome {...props}>
        <AchievementAdviceNode data={nodeData} />
      </NodeChrome>
    );
  }

  return (
    <NodeChrome {...props}>
      <div className="v2-opportunity-map">
        {nodeData.regions.map(
          (region: { label: string; count: number }, index: number) => (
            <section className={`v2-map-dot dot-${index + 1}`} key={region.label}>
              <strong>{region.count}</strong>
              <span>{region.label}</span>
            </section>
          ),
        )}
      </div>
    </NodeChrome>
  );
}
