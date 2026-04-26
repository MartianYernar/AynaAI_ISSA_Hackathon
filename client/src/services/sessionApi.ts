import type { OutputLanguage } from "../i18n/outputLanguage";
import type { StudentProfile } from "../types";

export type SessionBootstrapIdentity = {
  statement: string;
  strengthSignals: Array<{ label: string; evidence: string; score: number }>;
  growthGaps: Array<{ label: string; nextStep: string }>;
};

export type SessionBootstrapInterestSignals = {
  headline: string;
  signals: Array<{ label: string; score: number; category?: string }>;
};

export type SessionBootstrapPreviewStep = {
  id: string;
  label: string;
  description: string;
  status: "completed" | "current" | "next" | "locked";
};

export type SessionRoadmapPreview = {
  title: string;
  steps: SessionBootstrapPreviewStep[];
};

export type SessionOrbitalStep = {
  id: string;
  label: string;
  stage: string;
  status: "completed" | "current" | "next" | "locked";
  description?: string;
};

export type SessionRoadmapOrbital = {
  steps: SessionOrbitalStep[];
  links: Array<{ source: string; target: string }>;
};

export type SessionBootstrapResponse = {
  assistantMessage: string;
  identity: SessionBootstrapIdentity;
  interestSignals: SessionBootstrapInterestSignals;
  roadmapPreview: SessionRoadmapPreview;
  roadmapOrbital: SessionRoadmapOrbital;
};

const apiBase =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8001");

export async function fetchSessionBootstrap(
  profile: StudentProfile,
  guideId: string,
  outputLanguage: OutputLanguage = "en",
): Promise<SessionBootstrapResponse> {
  const prefix = apiBase.replace(/\/$/, "");
  const res = await fetch(`${prefix}/api/session/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...profile,
      guideId,
      outputLanguage,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bootstrap failed (${res.status}): ${text.slice(0, 400)}`);
  }

  return (await res.json()) as SessionBootstrapResponse;
}
