export type CareerIdentitySignal = {
  label: string;
  evidence: string;
  score?: number;
};

export type CareerIdentityGap = {
  label: string;
  nextStep: string;
};

export type CareerIdentityNodeData = {
  statement: string;
  strengthSignals: CareerIdentitySignal[];
  growthGaps: CareerIdentityGap[];
};

export function CareerIdentityNode({ data }: { data: CareerIdentityNodeData }) {
  return (
    <div className="career-identity-node">
      <section className="career-identity-statement">
        <span>Career identity</span>
        <strong>{data.statement}</strong>
      </section>

      <div className="career-identity-grid">
        <section>
          <h3>Strength signals</h3>
          <div className="career-signal-list">
            {data.strengthSignals.map((signal) => (
              <article key={signal.label}>
                <div>
                  <strong>{signal.label}</strong>
                  {typeof signal.score === "number" ? <b>{signal.score}%</b> : null}
                </div>
                <p>{signal.evidence}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h3>Growth gaps</h3>
          <div className="career-gap-list">
            {data.growthGaps.map((gap) => (
              <article key={gap.label}>
                <strong>{gap.label}</strong>
                <p>{gap.nextStep}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
