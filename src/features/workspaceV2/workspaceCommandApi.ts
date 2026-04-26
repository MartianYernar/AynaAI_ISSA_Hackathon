import type {
  WorkspaceCommandRequest,
  WorkspaceCommandResponse,
  WorkspaceEvent,
  WorkspaceModule,
} from "./types";

type WorkspaceApiMode = "mock" | "backend" | "auto";

const WORKSPACE_COMMAND_ENDPOINT =
  "http://localhost:8000/api/workspace/command";
const WORKSPACE_API_MODE: WorkspaceApiMode = parseWorkspaceApiMode(
  import.meta.env.VITE_WORKSPACE_API_MODE,
);

function parseWorkspaceApiMode(value: unknown): WorkspaceApiMode {
  return value === "backend" || value === "auto" || value === "mock"
    ? value
    : "mock";
}

function parseInterests(rawInterests: string) {
  const interests = rawInterests
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return interests.length > 0
    ? interests.slice(0, 4)
    : ["Technology", "Design", "Research", "Communication"];
}

function hasModule(request: WorkspaceCommandRequest, moduleId: string) {
  return request.existingModules.some((module) => module.id === moduleId);
}

function createProfileModule(request: WorkspaceCommandRequest): WorkspaceModule {
  const profile = request.studentProfile;

  return {
    id: "profile-summary",
    type: "profile-summary",
    title: "Student signal",
    position: { x: 120, y: 100 },
    size: { width: 340, height: 250 },
    state: "visible",
    data: {
      name: profile.name || "Student",
      gradeOrAge: profile.gradeOrAge || "Grade not set",
      region: profile.region || "Region not set",
      englishLevel: profile.englishLevel,
      focus: [
        profile.interests || "Interests not set",
        profile.challenge || "Next step still open",
        profile.hasAchievements,
      ],
    },
  };
}

function createCareerIdentityModule(
  request: WorkspaceCommandRequest,
): WorkspaceModule {
  const profile = request.studentProfile;
  const primaryInterest = parseInterests(profile.interests)[0];

  return {
    id: "career-identity",
    type: "career-identity",
    title: "Career identity",
    position: { x: 84, y: 116 },
    size: { width: 460, height: 360 },
    state: "visible",
    data: {
      statement: `${profile.name || "You"} learns best by connecting ${primaryInterest.toLowerCase()} with visible projects and practical outcomes.`,
      strengthSignals: [
        {
          label: primaryInterest,
          evidence: "Shows up as a repeated interest and can anchor the first roadmap.",
          score: 88,
        },
        {
          label: "Reflection",
          evidence:
            profile.challenge || "A clear challenge gives Lyra something useful to coach.",
          score: 76,
        },
        {
          label: "Achievement awareness",
          evidence: profile.hasAchievements,
          score: profile.hasAchievements.toLowerCase().startsWith("yes")
            ? 82
            : 58,
        },
      ],
      growthGaps: [
        {
          label: "Evidence depth",
          nextStep: "Turn one activity into proof with role, output, and result.",
        },
        {
          label: "Opportunity fit",
          nextStep: "Compare nearby study paths against strengths and English level.",
        },
      ],
    },
  };
}

function createInterestSignalModule(
  request: WorkspaceCommandRequest,
): WorkspaceModule {
  const interests = parseInterests(request.studentProfile.interests);

  return {
    id: "interest-signal",
    type: "interest-signal",
    title: "Interest signal",
    position: { x: 606, y: 92 },
    size: { width: 360, height: 330 },
    state: "visible",
    data: {
      headline: "Your strongest learning pulls",
      signals: interests.map((label, index) => ({
        category:
          index === 0 ? "primary" : index === 1 ? "supporting" : "emerging",
        label,
        score: Math.max(54, 91 - index * 12),
      })),
    },
  };
}

function createRoadmapMapPreviewModule(): WorkspaceModule {
  return {
    id: "roadmap-map-preview",
    type: "roadmap-map-preview",
    title: "Path preview",
    position: { x: 248, y: 520 },
    size: { width: 620, height: 350 },
    state: "visible",
    data: {
      title: "First path from signal to opportunity",
      steps: [
        {
          id: "start",
          description: "Confirm direction",
          label: "Start",
          status: "completed",
        },
        {
          id: "skills",
          description: "Choose skills to practice",
          label: "Skills",
          status: "current",
        },
        {
          id: "project",
          description: "Build one proof project",
          label: "Project",
          status: "next",
        },
        {
          id: "portfolio",
          description: "Package evidence",
          label: "Portfolio",
          status: "locked",
        },
        {
          id: "opportunity",
          description: "Match programs",
          label: "Opportunity",
          status: "locked",
        },
      ],
    },
  };
}

function createInterestChartModule(request: WorkspaceCommandRequest): WorkspaceModule {
  const interests = parseInterests(request.studentProfile.interests);

  return {
    id: "interest-chart",
    type: "interest-chart",
    title: "Interest chart",
    position: { x: 250, y: 410 },
    size: { width: 360, height: 280 },
    state: "visible",
    data: {
      interests: interests.map((label, index) => ({
        label,
        score: Math.max(55, 90 - index * 11),
      })),
    },
  };
}

function createRoadmapMapModule(request: WorkspaceCommandRequest): WorkspaceModule {
  const primaryInterest = parseInterests(request.studentProfile.interests)[0];

  return {
    id: "roadmap-map",
    type: "roadmap-map",
    title: "Roadmap map",
    position: { x: 560, y: 76 },
    size: { width: 560, height: 360 },
    state: "visible",
    data: {
      steps: [
        {
          id: "reflect",
          label: "Reflect",
          stage: "Start",
          status: "completed",
          x: 8,
          y: 46,
        },
        {
          id: "focus",
          label: `Focus on ${primaryInterest}`,
          stage: "Now",
          status: "current",
          x: 34,
          y: 20,
        },
        {
          id: "build",
          label: "Build proof",
          stage: "Next",
          status: "next",
          x: 58,
          y: 52,
        },
        {
          id: "apply",
          label: "Apply to opportunity",
          stage: "Later",
          status: "locked",
          x: 82,
          y: 26,
        },
      ],
      links: [
        { source: "reflect", target: "focus" },
        { source: "focus", target: "build" },
        { source: "build", target: "apply" },
      ],
    },
  };
}

function createCareerTableModule(): WorkspaceModule {
  return {
    id: "career-table",
    type: "career-table",
    title: "Career match table",
    position: { x: 560, y: 470 },
    size: { width: 520, height: 300 },
    state: "visible",
    data: {
      rows: [
        {
          role: "Frontend engineer",
          fit: 88,
          signal: "Builds visible products and learns through prototypes.",
        },
        {
          role: "UX researcher",
          fit: 76,
          signal: "Strong reflection and user-question framing.",
        },
        {
          role: "EdTech designer",
          fit: 72,
          signal: "Connects learning needs with practical tools.",
        },
      ],
    },
  };
}

function createAchievementEvidenceModule(): WorkspaceModule {
  return {
    id: "achievement-evidence",
    type: "achievement-evidence",
    title: "Achievement evidence",
    position: { x: -280, y: 420 },
    size: { width: 410, height: 300 },
    state: "visible",
    data: {
      items: [
        {
          source: "Project or contest",
          evidence: "Problem, role, output, and measurable result",
        },
        {
          source: "Course or certificate",
          evidence: "Skill proof connected to a real project",
        },
        {
          source: "Team activity",
          evidence: "Responsibility, collaboration, and result",
        },
      ],
    },
  };
}

function mockSendWorkspaceCommand(
  request: WorkspaceCommandRequest,
): WorkspaceCommandResponse {
  const command = request.commandText.trim().toLowerCase();

  if (command === "__start__") {
    return {
      assistantMessage:
        "I built your starting canvas: identity, interest signal, and a first path preview. We can expand any part when you are ready.",
      assistantState: "speaking",
      events: [
        { id: "start-speaking", type: "set_assistant_state", state: "speaking" },
        {
          id: "start-foundation-modules",
          type: "spawn_modules",
          modules: [
            hasModule(request, "career-identity")
              ? null
              : createCareerIdentityModule(request),
            hasModule(request, "interest-signal")
              ? null
              : createInterestSignalModule(request),
            hasModule(request, "roadmap-map-preview")
              ? null
              : createRoadmapMapPreviewModule(),
          ].filter(Boolean) as WorkspaceModule[],
        },
        {
          id: "start-connect-foundation",
          type: "connect_modules",
          edges: [
            {
              id: "identity-to-interest-signal",
              source: "career-identity",
              target: "interest-signal",
              label: "signals",
            },
            {
              id: "identity-to-path-preview",
              source: "career-identity",
              target: "roadmap-map-preview",
              label: "starts",
            },
          ],
        },
        {
          id: "start-focus-identity",
          type: "focus_module",
          moduleId: "career-identity",
        },
      ],
    };
  }

  if (command.includes("roadmap")) {
    return {
      assistantMessage:
        "I mapped your next steps and opened the interest signal that supports the roadmap.",
      assistantState: "speaking",
      events: [
        { id: "roadmap-speaking", type: "set_assistant_state", state: "speaking" },
        {
          id: "roadmap-modules",
          type: "spawn_modules",
          modules: [
            hasModule(request, "roadmap-map")
              ? null
              : createRoadmapMapModule(request),
            hasModule(request, "interest-chart")
              ? null
              : createInterestChartModule(request),
          ].filter(Boolean) as WorkspaceModule[],
        },
        {
          id: "roadmap-connect",
          type: "connect_modules",
          edges: [
            {
              id: "profile-to-roadmap",
              source: "profile-summary",
              target: "roadmap-map",
              label: "guides",
            },
            {
              id: "interest-to-roadmap",
              source: "interest-chart",
              target: "roadmap-map",
              label: "informs",
            },
          ],
        },
        { id: "roadmap-focus", type: "focus_module", moduleId: "roadmap-map" },
      ],
    };
  }

  if (command.includes("career")) {
    return {
      assistantMessage: "I opened career matches based on your current signals.",
      assistantState: "speaking",
      events: [
        {
          id: "career-module",
          type: "spawn_modules",
          modules: hasModule(request, "career-table")
            ? []
            : [createCareerTableModule()],
        },
        {
          id: "career-connect",
          type: "connect_modules",
          edges: [
            {
              id: "profile-to-career",
              source: "profile-summary",
              target: "career-table",
              label: "matches",
            },
          ],
        },
        { id: "career-focus", type: "focus_module", moduleId: "career-table" },
      ],
    };
  }

  if (command.includes("achievement")) {
    return {
      assistantMessage:
        "I opened evidence ideas so you can turn experience into portfolio proof.",
      assistantState: "speaking",
      events: [
        {
          id: "achievement-module",
          type: "spawn_modules",
          modules: hasModule(request, "achievement-evidence")
            ? []
            : [createAchievementEvidenceModule()],
        },
        {
          id: "achievement-connect",
          type: "connect_modules",
          edges: [
            {
              id: "profile-to-achievement",
              source: "profile-summary",
              target: "achievement-evidence",
              label: "evidence",
            },
          ],
        },
        {
          id: "achievement-focus",
          type: "focus_module",
          moduleId: "achievement-evidence",
        },
      ],
    };
  }

  return {
    assistantMessage:
      "I can open roadmap, career, or achievement modules from here.",
    assistantState: "speaking",
    events: [
      {
        id: "unknown-message",
        type: "assistant_message",
        message: "Try roadmap, career, or achievement.",
      },
      {
        id: "unknown-profile",
        type: "spawn_modules",
        modules: hasModule(request, "profile-summary")
          ? []
          : [createProfileModule(request)],
      },
      { id: "unknown-focus-profile", type: "focus_module", moduleId: "profile-summary" },
    ],
  };
}

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

function createBackendErrorResponse(): WorkspaceCommandResponse {
  return {
    assistantMessage:
      "I could not reach the workspace command service. Please try again in a moment.",
    assistantState: "speaking",
    events: [
      {
        id: "workspace-backend-error-message",
        type: "assistant_message",
        message:
          "Workspace command service is unavailable. No modules were changed.",
      },
    ],
  };
}

async function sendWorkspaceCommandToBackend(
  request: WorkspaceCommandRequest,
): Promise<WorkspaceCommandResponse> {
  // Backend team: implement POST /api/workspace/command with the exact
  // WorkspaceCommandRequest body and WorkspaceCommandResponse JSON contract.
  const response = await fetch(WORKSPACE_COMMAND_ENDPOINT, {
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Workspace command API returned ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!isWorkspaceCommandResponse(payload)) {
    throw new Error("Workspace command API response did not match contract");
  }

  return {
    ...payload,
    events: payload.events as WorkspaceEvent[],
  };
}

export async function sendWorkspaceCommand(
  request: WorkspaceCommandRequest,
): Promise<WorkspaceCommandResponse> {
  if (WORKSPACE_API_MODE === "mock") {
    return mockSendWorkspaceCommand(request);
  }

  if (WORKSPACE_API_MODE === "backend") {
    try {
      return await sendWorkspaceCommandToBackend(request);
    } catch (error) {
      console.warn("Workspace backend command failed.", error);
      return createBackendErrorResponse();
    }
  }

  try {
    return await sendWorkspaceCommandToBackend(request);
  } catch (error) {
    console.warn(
      "Workspace backend unavailable; falling back to mock command response.",
      error,
    );
    return mockSendWorkspaceCommand(request);
  }
}
