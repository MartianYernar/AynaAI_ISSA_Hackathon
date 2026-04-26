import type { WorkspaceNodeSchema } from "./types";

function joinParts(parts: string[]): string {
  return parts
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(". ");
}

export function getSpeakableTextForNode(node: WorkspaceNodeSchema): string {
  const { title, type, data } = node;
  const d = data as Record<string, unknown>;

  switch (type) {
    case "gemini-island": {
      const parts = [title];
      if (typeof d.eyebrow === "string" && d.eyebrow.trim()) {
        parts.push(d.eyebrow);
      }
      if (typeof d.lead === "string" && d.lead.trim()) {
        parts.push(d.lead);
      }
      if (Array.isArray(d.bullets)) {
        for (const b of d.bullets) {
          if (typeof b === "string" && b.trim()) {
            parts.push(b);
          }
        }
      }
      if (Array.isArray(d.metrics)) {
        for (const m of d.metrics) {
          if (m && typeof m === "object") {
            const o = m as { label?: string; value?: string };
            parts.push(`${o.label ?? ""} ${o.value ?? ""}`);
          }
        }
      }
      if (Array.isArray(d.steps)) {
        for (const s of d.steps) {
          if (s && typeof s === "object") {
            const o = s as { title?: string; detail?: string };
            parts.push(`${o.title ?? ""}. ${o.detail ?? ""}`);
          }
        }
      }
      return joinParts(parts);
    }
    case "profile-summary": {
      const focus = Array.isArray(d.focus)
        ? (d.focus as string[]).filter(Boolean)
        : [];
      return joinParts([
        title,
        String(d.name ?? ""),
        `${d.gradeOrAge ?? ""}, ${d.region ?? ""}, ${d.englishLevel ?? ""}`,
        ...focus,
      ]);
    }
    case "career-identity": {
      const parts = [title, String(d.statement ?? "")];
      const signals = Array.isArray(d.strengthSignals)
        ? (d.strengthSignals as { label?: string; evidence?: string }[])
        : [];
      for (const s of signals) {
        parts.push(`${s.label ?? ""}. ${s.evidence ?? ""}`);
      }
      const gaps = Array.isArray(d.growthGaps)
        ? (d.growthGaps as { label?: string; nextStep?: string }[])
        : [];
      for (const g of gaps) {
        parts.push(`${g.label ?? ""}. ${g.nextStep ?? ""}`);
      }
      return joinParts(parts);
    }
    case "interest-signal": {
      const parts = [title, String(d.headline ?? "")];
      const signals = Array.isArray(d.signals)
        ? (d.signals as { label?: string; score?: number; category?: string }[])
        : [];
      for (const s of signals) {
        parts.push(`${s.label ?? ""}, score ${s.score ?? ""}`);
      }
      return joinParts(parts);
    }
    case "interest-chart": {
      const parts = [title];
      const interests = Array.isArray(d.interests)
        ? (d.interests as { label?: string; score?: number }[])
        : [];
      for (const i of interests) {
        parts.push(`${i.label ?? ""} ${i.score ?? ""} percent`);
      }
      return joinParts(parts);
    }
    case "roadmap-map-preview": {
      const parts = [title, String(d.title ?? "")];
      const steps = Array.isArray(d.steps)
        ? (d.steps as { label?: string; description?: string }[])
        : [];
      for (const s of steps) {
        parts.push(`${s.label ?? ""}. ${s.description ?? ""}`);
      }
      return joinParts(parts);
    }
    case "roadmap-timeline": {
      const parts = [title];
      const milestones = Array.isArray(d.milestones)
        ? (d.milestones as { phase?: string; title?: string; detail?: string }[])
        : [];
      for (const m of milestones) {
        parts.push(
          `${m.phase ?? ""}. ${m.title ?? ""}. ${m.detail ?? ""}`,
        );
      }
      return joinParts(parts);
    }
    case "roadmap-map": {
      const parts = [title];
      const steps = Array.isArray(d.steps)
        ? (d.steps as {
            label?: string;
            stage?: string;
            description?: string;
            status?: string;
          }[])
        : [];
      for (const s of steps) {
        parts.push(
          `${s.label ?? ""}. ${s.stage ?? ""}. ${s.description ?? ""}. Status ${s.status ?? ""}`,
        );
      }
      return joinParts(parts);
    }
    case "career-table": {
      const parts = [title];
      const rows = Array.isArray(d.rows)
        ? (d.rows as { role?: string; fit?: number; signal?: string }[])
        : [];
      for (const r of rows) {
        parts.push(`${r.role ?? ""}. Fit ${r.fit ?? ""}. ${r.signal ?? ""}`);
      }
      return joinParts(parts);
    }
    case "achievement-evidence": {
      const parts = [title];
      const items = Array.isArray(d.items)
        ? (d.items as { source?: string; evidence?: string }[])
        : [];
      for (const it of items) {
        parts.push(`${it.source ?? ""}. ${it.evidence ?? ""}`);
      }
      return joinParts(parts);
    }
    case "opportunity-map": {
      const parts = [title];
      const regions = Array.isArray(d.regions)
        ? (d.regions as { label?: string; count?: number }[])
        : [];
      for (const r of regions) {
        parts.push(`${r.label ?? ""}, ${r.count ?? ""} opportunities`);
      }
      return joinParts(parts);
    }
    case "admission-probability": {
      const parts = [title, String(d.disclaimer ?? "")];
      const targets = Array.isArray(d.targets)
        ? (d.targets as {
            university?: string;
            major?: string;
            probability?: number;
            bandLow?: number;
            bandHigh?: number;
            drivers?: { label?: string; detail?: string }[];
          }[])
        : [];
      for (const t of targets) {
        parts.push(
          `${t.university ?? ""}, ${t.major ?? ""}. Estimated illustrative chance around ${t.probability ?? ""} percent, band ${t.bandLow ?? ""} to ${t.bandHigh ?? ""}.`,
        );
        const drivers = Array.isArray(t.drivers) ? t.drivers : [];
        for (const dr of drivers) {
          parts.push(`${dr.label ?? ""}. ${dr.detail ?? ""}`);
        }
      }
      return joinParts(parts);
    }
    case "achievement-review": {
      const parts = [
        title,
        String(d.headline ?? ""),
        String(d.narrative ?? ""),
      ];
      for (const s of Array.isArray(d.strengths) ? d.strengths : []) {
        parts.push(String(s));
      }
      for (const s of Array.isArray(d.gaps) ? d.gaps : []) {
        parts.push(String(s));
      }
      return joinParts(parts);
    }
    case "achievement-rubric": {
      const parts = [title];
      const rubric = Array.isArray(d.rubric)
        ? (d.rubric as { criterion?: string; score?: number; max?: number }[])
        : [];
      for (const r of rubric) {
        parts.push(`${r.criterion ?? ""}: ${r.score ?? ""} out of ${r.max ?? ""}`);
      }
      return joinParts(parts);
    }
    case "achievement-advice": {
      const parts = [title];
      for (const a of Array.isArray(d.advice) ? d.advice : []) {
        parts.push(String(a));
      }
      parts.push(String(d.honestyNote ?? ""));
      return joinParts(parts);
    }
    default:
      return title;
  }
}
