import type { AchievementRubricRow } from "./AchievementReviewNode";

export type AchievementRubricNodeData = {
  rubric: AchievementRubricRow[];
};

export function AchievementRubricNode({
  data,
}: {
  data: AchievementRubricNodeData;
}) {
  if (!data.rubric?.length) {
    return (
      <p className="achievement-review-narrative" style={{ opacity: 0.75 }}>
        —
      </p>
    );
  }

  return (
    <div className="achievement-review-rubric" aria-label="Rubric scores">
      {data.rubric.map((row) => (
        <div className="achievement-rubric-row" key={row.criterion}>
          <div>
            <span>{row.criterion}</span>
            <b>
              {row.score}/{row.max}
            </b>
          </div>
          <div className="achievement-rubric-track">
            <div
              className="achievement-rubric-fill"
              style={{
                width: `${Math.min(100, (row.score / Math.max(1, row.max)) * 100)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
