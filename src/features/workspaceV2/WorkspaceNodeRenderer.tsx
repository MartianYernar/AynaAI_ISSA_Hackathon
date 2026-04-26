import { Minus, X } from "lucide-react";
import type { NodeProps } from "@xyflow/react";
import type { WorkspaceNodeSchema } from "./types";
import type { ReactNode } from "react";

type RendererProps = NodeProps & {
  data: WorkspaceNodeSchema["data"] & {
    workspaceNode: WorkspaceNodeSchema;
    onMinimize: (id: string) => void;
    onHide: (id: string) => void;
  };
};

function NodeChrome({ children, data }: RendererProps & { children: ReactNode }) {
  const workspaceNode = data.workspaceNode;

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
          <button
            aria-label={`Minimize ${workspaceNode.title}`}
            onClick={() => data.onMinimize(workspaceNode.id)}
            type="button"
          >
            <Minus size={13} strokeWidth={1.9} />
          </button>
          <button
            aria-label={`Hide ${workspaceNode.title}`}
            onClick={() => data.onHide(workspaceNode.id)}
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
        <div className="v2-roadmap-map">
          <svg aria-hidden="true" viewBox="0 0 100 100">
            {nodeData.links.map((link: { source: string; target: string }) => {
              const source = nodeData.steps.find(
                (step: { id: string }) => step.id === link.source,
              );
              const target = nodeData.steps.find(
                (step: { id: string }) => step.id === link.target,
              );

              return source && target ? (
                <line
                  key={`${link.source}-${link.target}`}
                  x1={source.x}
                  x2={target.x}
                  y1={source.y}
                  y2={target.y}
                />
              ) : null;
            })}
          </svg>
          {nodeData.steps.map(
            (step: {
              id: string;
              label: string;
              stage: string;
              status: "locked" | "current" | "next" | "completed";
              x: number;
              y: number;
            }) => (
              <section
                className={`roadmap-map-step is-${step.status}`}
                key={step.id}
                style={{ left: `${step.x}%`, top: `${step.y}%` }}
              >
                <span>{step.stage}</span>
                <strong>{step.label}</strong>
                <b>{step.status}</b>
              </section>
            ),
          )}
        </div>
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
