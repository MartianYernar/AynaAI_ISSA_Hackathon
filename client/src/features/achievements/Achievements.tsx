import type { IslandDefinition } from "../../types";

interface AchievementsProps {
  island: IslandDefinition;
}

export function Achievements({ island }: AchievementsProps) {
  return (
    <div className="island-content">
      <p>{island.summary}</p>
      <ul className="evidence-list">
        {island.content.map((item) => (
          <li key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
