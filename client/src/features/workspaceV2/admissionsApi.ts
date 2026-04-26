import type { OutputLanguage } from "../../i18n/outputLanguage";
import type { StudentProfile } from "../../types";
import type { WorkspaceImageAttachment } from "./imageAttachmentUtils";
import type { WorkspaceCommandResponse } from "./types";

const apiBase =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8001");

const ADMISSIONS_ENDPOINT = `${apiBase.replace(/\/$/, "")}/api/admissions/readiness`;

const TIMEOUT_MS = 90_000;

function isWorkspaceCommandResponse(
  value: unknown,
): value is WorkspaceCommandResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<WorkspaceCommandResponse>;
  return (
    typeof candidate.assistantMessage === "string" &&
    typeof candidate.assistantState === "string" &&
    Array.isArray(candidate.events)
  );
}

export async function fetchAdmissionsReadiness(input: {
  profile: StudentProfile;
  achievementsText: string;
  targetUniversities: string;
  targetMajors: string;
  attachments: WorkspaceImageAttachment[];
  existingModuleIds: string[];
  outputLanguage: OutputLanguage;
}): Promise<WorkspaceCommandResponse> {
  const controller = new AbortController();
  const tid = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(ADMISSIONS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        studentProfile: input.profile,
        achievementsText: input.achievementsText.trim(),
        targetUniversities: input.targetUniversities.trim(),
        targetMajors: input.targetMajors.trim(),
        attachments: input.attachments.map(({ mimeType, dataBase64 }) => ({
          mimeType,
          dataBase64,
        })),
        existingModules: input.existingModuleIds.map((id) => ({ id })),
        outputLanguage: input.outputLanguage,
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        detail || `Admissions API returned ${response.status}`,
      );
    }
    const payload = (await response.json()) as unknown;
    if (!isWorkspaceCommandResponse(payload)) {
      throw new Error("Admissions API response shape invalid");
    }
    return {
      ...payload,
      events: payload.events,
    };
  } finally {
    window.clearTimeout(tid);
  }
}
