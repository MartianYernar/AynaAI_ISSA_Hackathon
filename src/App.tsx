import { useEffect, useMemo, useRef, useState } from "react";
import { DesktopCharacter } from "./components/avatar";
import { WorkspaceModuleRenderer } from "./components/workspace";
import { getMockWorkspaceModules } from "./services";
import { useCharacterStore } from "./store";
import type { StudentProfile, WorkspaceModule } from "./types";
import "./styles/globals.css";

type AppPhase = "onboarding" | "character-selection" | "workspace";
type CharacterOption = "ayna" | "mentor" | "compass" | "builder";

interface OnboardingStep {
  id: keyof StudentProfile;
  eyebrow: string;
  title: string;
  helper: string;
  placeholder?: string;
  type?: "input" | "select" | "textarea";
  options?: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "name",
    eyebrow: "Step 1",
    title: "What should Ayna call you?",
    helper: "Use the name you want your guide to use in the workspace.",
    placeholder: "Your name",
  },
  {
    id: "gradeOrAge",
    eyebrow: "Step 2",
    title: "What grade or age are you?",
    helper: "This helps Ayna keep the roadmap realistic.",
    placeholder: "Grade 10, 16, first year",
  },
  {
    id: "region",
    eyebrow: "Step 3",
    title: "Where are you based?",
    helper: "Region matters for opportunities, language, and local context.",
    placeholder: "City or region",
  },
  {
    id: "englishLevel",
    eyebrow: "Step 4",
    title: "What is your English level?",
    helper: "Ayna can adjust wording and resources to your comfort level.",
    type: "select",
    options: [
      "Beginner",
      "Elementary",
      "Intermediate",
      "Upper-intermediate",
      "Advanced",
    ],
  },
  {
    id: "interests",
    eyebrow: "Step 5",
    title: "What subjects or interests pull you in?",
    helper: "A few words are enough. You can be broad or specific.",
    placeholder: "Design, medicine, business, games",
    type: "textarea",
  },
  {
    id: "challenge",
    eyebrow: "Step 6",
    title: "What feels hardest right now?",
    helper: "Optional, but useful for shaping the first conversation.",
    placeholder: "Choosing a direction, finding projects, confidence",
    type: "textarea",
  },
  {
    id: "hasAchievements",
    eyebrow: "Step 7",
    title: "Do you already have achievements to organize?",
    helper: "Ayna can turn projects, certificates, contests, or volunteer work into portfolio evidence later.",
    type: "select",
    options: [
      "Yes, I have a few",
      "Maybe, I am not sure what counts",
      "Not yet",
    ],
  },
];

const characterOptions: Array<{
  id: CharacterOption;
  name: string;
  description: string;
}> = [
  {
    id: "ayna",
    name: "Ayna",
    description: "Calm mirror for reflection and direction.",
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Practical guide for next steps and proof.",
  },
  {
    id: "compass",
    name: "Compass",
    description: "Quiet companion for exploring possible paths.",
  },
  {
    id: "builder",
    name: "Builder",
    description: "Focused partner for turning ideas into projects.",
  },
];

const workspaceModuleTriggers: Array<{
  ids: string[];
  keywords: string[];
}> = [
  { ids: ["interest-bars", "roadmap-timeline"], keywords: ["roadmap", "path", "plan", "next"] },
  { ids: ["interest-bars"], keywords: ["strength", "interest", "subject"] },
  { ids: ["achievement-evidence"], keywords: ["upload", "evidence", "achievement", "portfolio"] },
  { ids: ["career-match-table", "opportunities-map"], keywords: ["career", "fit", "match", "opportunity"] },
];

function OnboardingScreen({
  profile,
  onChange,
  onDone,
}: {
  profile: StudentProfile;
  onChange: (field: keyof StudentProfile, value: string) => void;
  onDone: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const setCharacterPosition = useCharacterStore((state) => state.setPosition);
  const setCharacterState = useCharacterStore((state) => state.setState);
  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const progress = ((stepIndex + 1) / onboardingSteps.length) * 100;

  useEffect(() => {
    setCharacterPosition(116, 224);
    setCharacterState(stepIndex === 0 ? "greet" : "speaking");
  }, [setCharacterPosition, setCharacterState, stepIndex]);

  useEffect(
    () => () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    },
    [],
  );

  const continueStep = () => {
    setIsThinking(true);
    setCharacterState("thinking");

    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsThinking(false);

      if (!isLastStep) {
        setStepIndex((current) => current + 1);
        return;
      }

      onDone();
    }, 420);
  };

  const goBack = () => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setIsThinking(false);
    setStepIndex((current) => Math.max(0, current - 1));
  };

  const fieldValue = profile[step.id];
  const nextLabel = isLastStep ? "Choose guide" : "Continue";

  const renderQuestionInput = () => {
    if (step.type === "select") {
      return (
        <select
          autoFocus
          disabled={isThinking}
          onChange={(event) => onChange(step.id, event.target.value)}
          value={fieldValue}
        >
          {step.options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      );
    }

    if (step.type === "textarea") {
      return (
        <textarea
          autoFocus
          disabled={isThinking}
          onChange={(event) => onChange(step.id, event.target.value)}
          placeholder={step.placeholder}
          rows={4}
          value={fieldValue}
        />
      );
    }

    return (
      <input
        autoFocus
        disabled={isThinking}
        onChange={(event) => onChange(step.id, event.target.value)}
        placeholder={step.placeholder}
        value={fieldValue}
      />
    );
  };

  return (
    <main className="stage-screen onboarding-screen">
      <section className="onboarding-shell" aria-labelledby="onboarding-title">
        <aside className="onboarding-guide" aria-label="Lyra onboarding guide">
          <div className="onboarding-lyra-zone">
            <DesktopCharacter />
          </div>
          <div className="guide-message">
            <span>Lyra is guiding setup</span>
            <p>
              {stepIndex === 0
                ? "Hi, I am Lyra. I will ask one thing at a time so your roadmap starts with the right context."
                : "Answer in your own words. Short answers are enough, and you can refine everything later."}
            </p>
          </div>
        </aside>

        <section className="stage-card onboarding-card">
          <div className="progress-shell" aria-label="Onboarding progress">
            <span>
              {stepIndex + 1} / {onboardingSteps.length}
            </span>
            <div>
              <i style={{ width: `${progress}%` }} />
            </div>
          </div>

          <form
            className="question-card"
            key={step.id}
            onSubmit={(event) => {
              event.preventDefault();
              continueStep();
            }}
          >
            <div className="stage-heading">
              <span>{step.eyebrow}</span>
              <h1 id="onboarding-title">{step.title}</h1>
              <p>{step.helper}</p>
            </div>

            {renderQuestionInput()}

            <div className="stage-actions">
              <button
                disabled={stepIndex === 0 || isThinking}
                onClick={goBack}
                type="button"
              >
                Back
              </button>
              <button disabled={isThinking} type="submit">
                {isThinking ? "Thinking" : nextLabel}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

function CharacterSelectionScreen({
  selectedCharacter,
  onSelect,
  onContinue,
}: {
  selectedCharacter: CharacterOption;
  onSelect: (character: CharacterOption) => void;
  onContinue: () => void;
}) {
  return (
    <main className="stage-screen">
      <section className="stage-card guide-card" aria-labelledby="guide-title">
        <div className="stage-heading">
          <span>Guide</span>
          <h1 id="guide-title">Choose your guide</h1>
          <p>Select the AI companion that should enter the workspace with you.</p>
        </div>

        <div className="guide-selector" aria-label="Character options">
          {characterOptions.map((option) => (
            <button
              className={selectedCharacter === option.id ? "is-selected" : ""}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <span className="guide-preview" aria-hidden="true">
                <span />
              </span>
              <strong>{option.name}</strong>
              <small>{option.description}</small>
            </button>
          ))}
        </div>

        <div className="stage-actions">
          <span>
            Selected:{" "}
            {
              characterOptions.find((option) => option.id === selectedCharacter)
                ?.name
            }
          </span>
          <button onClick={onContinue} type="button">
            Enter workspace
          </button>
        </div>
      </section>
    </main>
  );
}

function WorkspaceScreen({
  profile,
  selectedCharacter,
}: {
  profile: StudentProfile;
  selectedCharacter: CharacterOption;
}) {
  const [command, setCommand] = useState("");
  const [visibleModuleIds, setVisibleModuleIds] = useState<string[]>([
    "profile-summary",
  ]);
  const revealTimeoutsRef = useRef<number[]>([]);
  const startWorkspaceEntry = useCharacterStore(
    (state) => state.startWorkspaceEntry,
  );
  const setCharacterState = useCharacterStore((state) => state.setState);
  const workspaceModules = useMemo(
    () => getMockWorkspaceModules(profile),
    [profile],
  );
  const moduleById = useMemo(
    () =>
      workspaceModules.reduce<Record<string, WorkspaceModule>>((record, module) => {
        record[module.id] = module;
        return record;
      }, {}),
    [workspaceModules],
  );
  const visibleModules = visibleModuleIds
    .map((moduleId) => moduleById[moduleId])
    .filter(Boolean);
  const selectedGuide = useMemo(
    () =>
      characterOptions.find((option) => option.id === selectedCharacter) ??
      characterOptions[0],
    [selectedCharacter],
  );

  useEffect(() => {
    startWorkspaceEntry();
  }, [startWorkspaceEntry]);

  useEffect(
    () => () => {
      revealTimeoutsRef.current.forEach((timeoutId) =>
        window.clearTimeout(timeoutId),
      );
    },
    [],
  );

  const revealModules = (moduleIds: string[]) => {
    setCharacterState("thinking");

    moduleIds.forEach((moduleId, index) => {
      const timeoutId = window.setTimeout(() => {
        setVisibleModuleIds((current) =>
          current.includes(moduleId) ? current : [...current, moduleId],
        );

        if (index === moduleIds.length - 1) {
          setCharacterState("speaking");
        }
      }, index * 260);

      revealTimeoutsRef.current.push(timeoutId);
    });
  };

  const handleCommand = () => {
    const normalizedCommand = command.trim().toLowerCase();

    if (!normalizedCommand) {
      revealModules(["profile-summary"]);
      return;
    }

    const trigger = workspaceModuleTriggers.find((item) =>
      item.keywords.some((keyword) => normalizedCommand.includes(keyword)),
    );

    if (trigger) {
      revealModules(trigger.ids);
      setCommand("");
      return;
    }

    revealModules(["interest-bars", "career-match-table"]);
    setCommand("");
  };

  return (
    <main className="workspace-screen" aria-label="Ayna AI workspace">
      <div className="workspace-stage">
        <div className="workspace-brand">
          <span>Ayna AI</span>
          <strong>{selectedGuide.name} workspace</strong>
        </div>

        <section className="workspace-module-area" aria-label="Student modules">
          <div className="workspace-companion-dock">
            <DesktopCharacter />
          </div>

          <div className="module-grid">
            {visibleModules.map((module) => (
              <WorkspaceModuleRenderer key={module.id} module={module} />
            ))}
          </div>
        </section>

        <div className="workspace-actions" aria-label="Module actions">
          <nav>
            <button onClick={() => revealModules(["interest-bars", "roadmap-timeline"])} type="button">
              Show my roadmap
            </button>
            <button onClick={() => revealModules(["career-match-table", "opportunities-map"])} type="button">
              Career matches
            </button>
            <button onClick={() => revealModules(["achievement-evidence"])} type="button">
              Evidence ideas
            </button>
          </nav>
        </div>

        <form
          className="workspace-command"
          onSubmit={(event) => {
            event.preventDefault();
            handleCommand();
          }}
        >
          <input
            aria-label="Ask Ayna"
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Try: show my roadmap, career matches, evidence ideas"
            value={command}
          />
          <button type="submit">Send</button>
        </form>

        <p className="workspace-hint">
          Modules appear progressively as Lyra opens the next part of your workspace.
        </p>
      </div>
    </main>
  );
}

function App() {
  const [phase, setPhase] = useState<AppPhase>("onboarding");
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterOption>("ayna");
  const [profile, setProfile] = useState<StudentProfile>({
    name: "",
    gradeOrAge: "",
    region: "",
    englishLevel: "Intermediate",
    interests: "",
    challenge: "",
    hasAchievements: "Maybe, I am not sure what counts",
  });

  if (phase === "onboarding") {
    return (
      <OnboardingScreen
        profile={profile}
        onChange={(field, value) =>
          setProfile((current) => ({ ...current, [field]: value }))
        }
        onDone={() => setPhase("character-selection")}
      />
    );
  }

  if (phase === "character-selection") {
    return (
      <CharacterSelectionScreen
        onContinue={() => setPhase("workspace")}
        onSelect={setSelectedCharacter}
        selectedCharacter={selectedCharacter}
      />
    );
  }

  return <WorkspaceScreen profile={profile} selectedCharacter={selectedCharacter} />;
}

export default App;
