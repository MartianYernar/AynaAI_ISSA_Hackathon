import type {
  WorkspaceCommandRequest,
  WorkspaceCommandResponse,
  WorkspaceEvent,
  WorkspaceModule,
} from "./types";

type WorkspaceApiMode = "mock" | "backend" | "auto";

const apiBase =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? "" : "http://127.0.0.1:8001");

const WORKSPACE_COMMAND_ENDPOINT = `${apiBase.replace(/\/$/, "")}/api/workspace/command`;

const WORKSPACE_API_MODE: WorkspaceApiMode = parseWorkspaceApiMode(
  import.meta.env.VITE_WORKSPACE_API_MODE,
);

function parseWorkspaceApiMode(value: unknown): WorkspaceApiMode {
  return value === "backend" || value === "auto" || value === "mock"
    ? value
    : "auto";
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
  const fromAi = request.aiBootstrap?.identity;
  if (fromAi) {
    return {
      id: "career-identity",
      type: "career-identity",
      title: "Career identity",
      position: { x: 84, y: 116 },
      size: { width: 460, height: 360 },
      state: "visible",
      data: fromAi,
    };
  }

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
  const fromAi = request.aiBootstrap?.interestSignals;
  if (fromAi) {
    return {
      id: "interest-signal",
      type: "interest-signal",
      title: "Interest signal",
      position: { x: 606, y: 92 },
      size: { width: 360, height: 330 },
      state: "visible",
      data: fromAi,
    };
  }

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

function createRoadmapMapPreviewModule(
  request: WorkspaceCommandRequest,
): WorkspaceModule {
  const fromAi = request.aiBootstrap?.roadmapPreview;
  if (fromAi) {
    return {
      id: "roadmap-map-preview",
      type: "roadmap-map-preview",
      title: "Path preview",
      position: { x: 248, y: 520 },
      size: { width: 620, height: 350 },
      state: "visible",
      data: fromAi,
    };
  }

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
  const fromAi = request.aiBootstrap?.interestSignals?.signals;
  if (fromAi?.length) {
    return {
      id: "interest-chart",
      type: "interest-chart",
      title: "Interest chart",
      position: { x: 250, y: 410 },
      size: { width: 360, height: 280 },
      state: "visible",
      data: {
        interests: fromAi.map((s) => ({
          label: s.label,
          score: s.score,
        })),
      },
    };
  }

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
  const fromAi = request.aiBootstrap?.roadmapOrbital;
  if (fromAi?.steps?.length) {
    return {
      id: "roadmap-map",
      type: "roadmap-map",
      title: "Roadmap map",
      position: { x: 560, y: 76 },
      size: { width: 560, height: 360 },
      state: "visible",
      data: fromAi,
    };
  }

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

/** New roadmap-style islands when fixed modules (orbital/chart) already exist on canvas. */
function createFreshRoadmapGeminiIslands(
  request: WorkspaceCommandRequest,
): WorkspaceModule[] {
  const ts = Date.now().toString(36);
  const p = request.studentProfile;
  const interests = parseInterests(p.interests);
  const anchor = interests[0] || "your focus area";
  const name = p.name?.trim() || "You";

  return [
    {
      id: `gemini-road-${ts}-a`,
      type: "gemini-island",
      title: "Roadmap — next moves",
      position: { x: 520, y: 100 },
      size: { width: 400, height: 360 },
      state: "visible",
      data: {
        variant: "steps",
        eyebrow: "Structured path",
        lead: `${name}, here is a fresh roadmap pass centered on ${anchor}.`,
        steps: [
          {
            title: "Define a 4-week goal",
            detail: "One sentence: what proof or skill will you have at the end?",
          },
          {
            title: "Ship a small artifact",
            detail: "Draft, prototype, short write-up, or video — finish something visible.",
          },
          {
            title: "Reflect and adjust",
            detail: "Note what felt hard and pick the next single step.",
          },
        ],
      },
    },
    {
      id: `gemini-road-${ts}-b`,
      type: "gemini-island",
      title: "Keep momentum",
      position: { x: 120, y: 380 },
      size: { width: 380, height: 280 },
      state: "visible",
      data: {
        variant: "checklist",
        eyebrow: "This week",
        bullets: [
          `Block 2× 45 minutes for ${anchor}`,
          p.challenge
            ? `Address: ${p.challenge.slice(0, 120)}${p.challenge.length > 120 ? "…" : ""}`
            : "Write one paragraph on why this direction matters to you",
          "Share progress with one person you trust",
        ],
      },
    },
  ];
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
    const welcome =
      request.aiBootstrap?.assistantMessage ??
      "I built your starting canvas: identity, interest signal, and a first path preview. We can expand any part when you are ready.";
    return {
      assistantMessage: welcome,
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
              : createRoadmapMapPreviewModule(request),
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
    const roadmapModules = [
      hasModule(request, "roadmap-map") ? null : createRoadmapMapModule(request),
      hasModule(request, "interest-chart") ? null : createInterestChartModule(request),
    ].filter(Boolean) as WorkspaceModule[];

    const modules =
      roadmapModules.length > 0
        ? roadmapModules
        : createFreshRoadmapGeminiIslands(request);

    const hasOrbital = modules.some((m) => m.id === "roadmap-map");
    const hasChart = modules.some((m) => m.id === "interest-chart");
    const focusId = hasOrbital
      ? "roadmap-map"
      : modules[0]?.id ?? "roadmap-map";

    const events: WorkspaceEvent[] = [
      { id: "roadmap-speaking", type: "set_assistant_state", state: "speaking" },
      { id: "roadmap-modules", type: "spawn_modules", modules },
    ];

    if (
      hasOrbital &&
      hasChart &&
      hasModule(request, "profile-summary")
    ) {
      events.push({
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
      });
    } else if (modules.length > 1) {
      events.push({
        id: "roadmap-chain",
        type: "connect_modules",
        edges: modules.slice(0, -1).map((m, i) => ({
          id: `roadmap-chain-${i}`,
          source: m.id,
          target: modules[i + 1]!.id,
          label: "→",
        })),
      });
    }

    events.push({
      id: "roadmap-focus",
      type: "focus_module",
      moduleId: focusId,
    });

    return {
      assistantMessage: hasOrbital
        ? "I mapped your next steps and opened the interest signal that supports the roadmap."
        : "Here is a fresh roadmap layout as new islands on your canvas.",
      assistantState: "speaking",
      events,
    };
  }

  if (command.includes("career")) {
    const careerModules = hasModule(request, "career-table")
      ? []
      : [createCareerTableModule()];
    const modules =
      careerModules.length > 0
        ? careerModules
        : [
            {
              id: `gemini-career-${Date.now().toString(36)}`,
              type: "gemini-island" as const,
              title: "Career exploration",
              position: { x: 500, y: 140 },
              size: { width: 380, height: 320 },
              state: "visible" as const,
              data: {
                variant: "steps" as const,
                eyebrow: "Try this",
                lead: "Here are practical ways to explore career fit without repeating the table you already have open.",
                steps: [
                  {
                    title: "Pick one role hypothesis",
                    detail: "Name one job family to test for two weeks (e.g. UX, data, teaching).",
                  },
                  {
                    title: "Find 3 real examples",
                    detail: "People, job posts, or portfolios that show what “good” looks like.",
                  },
                  {
                    title: "Run a micro-experiment",
                    detail: "2-hour task: summary, screenshot, or mini project that proves interest.",
                  },
                ],
              },
            },
          ];

    const events: WorkspaceEvent[] = [
      {
        id: "career-speaking",
        type: "set_assistant_state",
        state: "speaking",
      },
      {
        id: "career-module",
        type: "spawn_modules",
        modules,
      },
    ];

    if (
      modules.some((m) => m.id === "career-table") &&
      hasModule(request, "profile-summary")
    ) {
      events.push({
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
      });
    }

    events.push({
      id: "career-focus",
      type: "focus_module",
      moduleId: modules[0]!.id,
    });

    return {
      assistantMessage: "I opened career matches based on your current signals.",
      assistantState: "speaking",
      events,
    };
  }

  if (command.includes("achievement")) {
    const achModules = hasModule(request, "achievement-evidence")
      ? []
      : [createAchievementEvidenceModule()];
    const modules =
      achModules.length > 0
        ? achModules
        : [
            {
              id: `gemini-ach-${Date.now().toString(36)}`,
              type: "gemini-island" as const,
              title: "Portfolio evidence",
              position: { x: 480, y: 160 },
              size: { width: 380, height: 300 },
              state: "visible" as const,
              data: {
                variant: "checklist" as const,
                eyebrow: "Evidence",
                lead: "Turn what you have already done into portfolio-ready proof.",
                bullets: [
                  "Problem: one sentence on what you were solving",
                  "Your role: what you owned vs. what was shared",
                  "Output: link, file, or photo of the result",
                  "Impact: number, quote, or lesson learned",
                ],
              },
            },
          ];

    const events: WorkspaceEvent[] = [
      {
        id: "achievement-speaking",
        type: "set_assistant_state",
        state: "speaking",
      },
      {
        id: "achievement-module",
        type: "spawn_modules",
        modules,
      },
    ];

    if (
      modules.some((m) => m.id === "achievement-evidence") &&
      hasModule(request, "profile-summary")
    ) {
      events.push({
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
      });
    }

    events.push({
      id: "achievement-focus",
      type: "focus_module",
      moduleId: modules[0]!.id,
    });

    return {
      assistantMessage:
        "I opened evidence ideas so you can turn experience into portfolio proof.",
      assistantState: "speaking",
      events,
    };
  }

  const unknownModules = [
    ...(hasModule(request, "profile-summary")
      ? []
      : [createProfileModule(request)]),
  ];
  const unknownSpawn =
    unknownModules.length > 0
      ? unknownModules
      : createFreshRoadmapGeminiIslands(request);

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
        modules: unknownSpawn,
      },
      {
        id: "unknown-focus-profile",
        type: "focus_module",
        moduleId: unknownSpawn[0]!.id,
      },
    ],
  };
}

function responseHasSpawnIslands(response: WorkspaceCommandResponse): boolean {
  return response.events.some(
    (e) =>
      e.type === "spawn_modules" &&
      Array.isArray(e.modules) &&
      e.modules.length > 0,
  );
}

/** Backend occasionally returns text-only events; never leave the canvas empty. */
function withFallbackIslands(
  request: WorkspaceCommandRequest,
  response: WorkspaceCommandResponse,
): WorkspaceCommandResponse {
  if (responseHasSpawnIslands(response)) {
    return response;
  }
  const mock = mockSendWorkspaceCommand(request);
  const baseMsg =
    response.assistantMessage?.trim() || mock.assistantMessage;

  if (responseHasSpawnIslands(mock)) {
    return {
      assistantMessage: baseMsg,
      assistantState: mock.assistantState,
      events: mock.events,
    };
  }

  const emergency = createFreshRoadmapGeminiIslands(request);
  return {
    assistantMessage:
      baseMsg || "Here are some ideas you can use right away on the canvas.",
    assistantState: "speaking",
    events: [
      { id: "em-speak", type: "set_assistant_state", state: "speaking" },
      { id: "em-spawn", type: "spawn_modules", modules: emergency },
      ...(emergency.length > 1
        ? [
            {
              id: "em-chain",
              type: "connect_modules" as const,
              edges: emergency.slice(0, -1).map((m, i) => ({
                id: `em-c-${i}`,
                source: m.id,
                target: emergency[i + 1]!.id,
                label: "→",
              })),
            },
          ]
        : []),
      { id: "em-focus", type: "focus_module", moduleId: emergency[0]!.id },
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

const WORKSPACE_COMMAND_TIMEOUT_MS = 75_000;

async function sendWorkspaceCommandToBackend(
  request: WorkspaceCommandRequest,
): Promise<WorkspaceCommandResponse> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    WORKSPACE_COMMAND_TIMEOUT_MS,
  );

  try {
    const response = await fetch(WORKSPACE_COMMAND_ENDPOINT, {
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
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
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function sendWorkspaceCommand(
  request: WorkspaceCommandRequest,
): Promise<WorkspaceCommandResponse> {
  if (request.commandText.trim() === "__start__") {
    return mockSendWorkspaceCommand(request);
  }

  if (WORKSPACE_API_MODE === "mock") {
    return withFallbackIslands(request, mockSendWorkspaceCommand(request));
  }

  if (WORKSPACE_API_MODE === "backend") {
    try {
      const res = await sendWorkspaceCommandToBackend(request);
      return withFallbackIslands(request, res);
    } catch (error) {
      console.warn("Workspace backend command failed.", error);
      return withFallbackIslands(request, createBackendErrorResponse());
    }
  }

  try {
    const res = await sendWorkspaceCommandToBackend(request);
    return withFallbackIslands(request, res);
  } catch (error) {
    console.warn(
      "Workspace backend unavailable; falling back to mock command response.",
      error,
    );
    return withFallbackIslands(request, mockSendWorkspaceCommand(request));
  }
}
