import type { IslandDefinition } from "../../types";

interface CareerTrialProps {
  island: IslandDefinition;
}

export function CareerTrial({ island }: CareerTrialProps) {
  return (
    <div className="island-content">
      <p>{island.summary}</p>
      <div className="trial-panel">
        {island.content.map((item) => (
          <section key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </section>
        ))}
      </div>
    </div>
  );
}
