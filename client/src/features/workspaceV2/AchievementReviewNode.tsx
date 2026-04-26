export type AchievementRubricRow = {
  criterion: string;
  score: number;
  max: number;
};

/** Narrative + strengths + gaps only (rubric and advice are separate cards). */
export type AchievementReviewNodeData = {
  headline: string;
  narrative: string;
  strengths: string[];
  gaps: string[];
};

export function AchievementReviewNode({
  data,
}: {
  data: AchievementReviewNodeData;
}) {
  return (
    <div className="achievement-review-node">
      <header className="achievement-review-head">
        <span>Evaluation</span>
        <strong>{data.headline}</strong>
      </header>
      {data.narrative ? (
        <p className="achievement-review-narrative">{data.narrative}</p>
      ) : null}

      {data.strengths.length > 0 ? (
        <section className="achievement-review-list is-strengths">
          <h3>Strengths</h3>
          <ul>
            {data.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.gaps.length > 0 ? (
        <section className="achievement-review-list is-gaps">
          <h3>Gaps to close</h3>
          <ul>
            {data.gaps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
