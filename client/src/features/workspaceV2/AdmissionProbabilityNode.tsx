export type AdmissionDriver = {
  label: string;
  sentiment: "positive" | "neutral" | "negative" | string;
  detail: string;
};

export type AdmissionTarget = {
  university: string;
  major: string;
  probability: number;
  bandLow: number;
  bandHigh: number;
  drivers: AdmissionDriver[];
};

export type AdmissionProbabilityNodeData = {
  disclaimer: string;
  targets: AdmissionTarget[];
};

function sentimentClass(s: string): string {
  const x = s.toLowerCase();
  if (x === "positive") {
    return "is-positive";
  }
  if (x === "negative") {
    return "is-negative";
  }
  return "is-neutral";
}

export function AdmissionProbabilityNode({
  data,
}: {
  data: AdmissionProbabilityNodeData;
}) {
  return (
    <div className="admission-probability-node">
      {data.disclaimer?.trim() ? (
        <p className="admission-prob-disclaimer">{data.disclaimer}</p>
      ) : null}
      <div className="admission-prob-list">
        {data.targets.map((t, idx) => (
          <section
            className="admission-prob-card"
            key={`${idx}-${t.university}-${t.major}`}
          >
            <header>
              <strong>{t.university}</strong>
              <span className="admission-prob-major">{t.major}</span>
            </header>
            <div className="admission-prob-chart" aria-hidden="true">
              <div className="admission-prob-track">
                <div
                  className="admission-prob-band"
                  style={{
                    left: `${t.bandLow}%`,
                    width: `${Math.max(2, t.bandHigh - t.bandLow)}%`,
                  }}
                />
                <div
                  className="admission-prob-fill"
                  style={{ width: `${t.probability}%` }}
                />
              </div>
              <div className="admission-prob-scale">
                <span>0</span>
                <span className="admission-prob-mid-label">
                  illustrative estimate · {t.probability}%
                </span>
                <span>100</span>
              </div>
              <p className="admission-prob-band-label">
                Uncertainty band ~{t.bandLow}%–{t.bandHigh}%
              </p>
            </div>
            {t.drivers.length > 0 ? (
              <ul className="admission-prob-drivers">
                {t.drivers.map((d) => (
                  <li
                    className={`admission-driver ${sentimentClass(d.sentiment)}`}
                    key={`${d.label}-${d.detail.slice(0, 24)}`}
                  >
                    <span>{d.label}</span>
                    <p>{d.detail}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
