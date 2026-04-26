import type { IslandDefinition } from "../../types";

interface RoadmapProps {
  island: IslandDefinition;
}

export function Roadmap({ island }: RoadmapProps) {
  return (
    <div className="island-content">
      <p>{island.summary}</p>
      <ol className="roadmap-list">
        {island.content.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ol>
    </div>
  );
}
