export type GeminiIslandVariant = "insight" | "checklist" | "steps" | "metrics";

export type GeminiIslandNodeData = {
  variant: GeminiIslandVariant;
  eyebrow?: string;
  lead?: string;
  bullets?: string[];
  metrics?: Array<{ label: string; value: string }>;
  steps?: Array<{ title: string; detail: string }>;
};

export function GeminiIslandNode({ data }: { data: GeminiIslandNodeData }) {
  const variant = data.variant ?? "insight";

  return (
    <div className={`gemini-island-node variant-${variant}`}>
      {data.eyebrow ? (
        <span className="gemini-island-eyebrow">{data.eyebrow}</span>
      ) : null}

      {data.lead ? <p className="gemini-island-lead">{data.lead}</p> : null}

      {data.bullets?.length ? (
        <ul className="gemini-island-bullets">
          {data.bullets.map((b, i) => (
            <li key={`${i}-${b.slice(0, 32)}`}>{b}</li>
          ))}
        </ul>
      ) : null}

      {data.metrics?.length ? (
        <div className="gemini-island-metrics">
          {data.metrics.map((m) => (
            <div className="gemini-metric-pill" key={`${m.label}-${m.value}`}>
              <span>{m.label}</span>
              <strong>{m.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {data.steps?.length ? (
        <ol className="gemini-island-steps">
          {data.steps.map((s, i) => (
            <li key={`${s.title}-${i}`}>
              <strong>{s.title}</strong>
              {s.detail ? <p>{s.detail}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
