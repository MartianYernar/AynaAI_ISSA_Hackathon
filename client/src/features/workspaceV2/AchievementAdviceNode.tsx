export type AchievementAdviceNodeData = {
  advice: string[];
  honestyNote: string;
};

export function AchievementAdviceNode({
  data,
}: {
  data: AchievementAdviceNodeData;
}) {
  return (
    <div className="achievement-advice-node">
      {data.advice.length > 0 ? (
        <section className="achievement-review-advice">
          <h3>Next steps</h3>
          <ol>
            {data.advice.map((a, i) => (
              <li key={`${i}-${a.slice(0, 40)}`}>{a}</li>
            ))}
          </ol>
        </section>
      ) : null}
      {data.honestyNote ? (
        <p className="achievement-review-honesty">{data.honestyNote}</p>
      ) : null}
    </div>
  );
}
