import type { IslandDefinition } from "../../types";

interface CareerMatchProps {
  island: IslandDefinition;
}

export function CareerMatch({ island }: CareerMatchProps) {
  return (
    <div className="island-content">
      <p>{island.summary}</p>
      <div className="match-card">
        {island.content.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
