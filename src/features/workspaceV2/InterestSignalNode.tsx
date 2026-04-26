export type InterestSignal = {
  label: string;
  score: number;
  category?: string;
};

export type InterestSignalNodeData = {
  headline: string;
  signals: InterestSignal[];
};

export function InterestSignalNode({ data }: { data: InterestSignalNodeData }) {
  const strongestSignal = data.signals.reduce<InterestSignal | null>(
    (strongest, signal) =>
      !strongest || signal.score > strongest.score ? signal : strongest,
    null,
  );

  return (
    <div className="interest-signal-node">
      <header>
        <span>Interest signal</span>
        <strong>{data.headline}</strong>
      </header>

      {strongestSignal ? (
        <section className="interest-signal-focus">
          <b>{strongestSignal.score}%</b>
          <div>
            <span>Strongest pull</span>
            <strong>{strongestSignal.label}</strong>
          </div>
        </section>
      ) : null}

      <div className="interest-signal-bars">
        {data.signals.map((signal) => (
          <section key={signal.label}>
            <div>
              <strong>{signal.label}</strong>
              <span>{signal.score}%</span>
            </div>
            <i>
              <em style={{ width: `${Math.min(100, Math.max(0, signal.score))}%` }} />
            </i>
          </section>
        ))}
      </div>

      <div className="interest-signal-chips">
        {data.signals
          .filter((signal) => signal.category)
          .map((signal) => (
            <span key={`${signal.label}-${signal.category}`}>{signal.category}</span>
          ))}
      </div>
    </div>
  );
}
