import type { IslandDefinition } from "../../types";

interface InterestMapProps {
  island: IslandDefinition;
}

export function InterestMap({ island }: InterestMapProps) {
  return (
    <div className="island-content">
      <p>{island.summary}</p>
      <div className="interest-bars">
        {island.content.map((item, index) => (
          <div className="interest-row" key={item.label}>
            <span>{item.label}</span>
            <div>
              <i style={{ width: `${84 - index * 14}%` }} />
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
