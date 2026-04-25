import { useEffect, useMemo, useState } from "react";
import { DesktopCharacter } from "./components/avatar";
import { IslandsLayer } from "./components/islands";
import { WorkspacePlane } from "./components/scene/WorkspacePlane";
import { useCharacterStore, useIslandStore } from "./store";
import type { IslandId } from "./types";
import "./styles/globals.css";

type AppPhase = "onboarding" | "character-selection" | "workspace";
type CharacterOption = "ayna" | "mentor" | "compass" | "builder";

interface OnboardingForm {
  name: string;
  gradeOrAge: string;
  region: string;
  englishLevel: string;
  interests: string;
  challenge: string;
}

interface OnboardingStep {
  id: keyof OnboardingForm;
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

const islandTriggers: Array<{
  id: IslandId;
  keywords: string[];
}> = [
  { id: "roadmap", keywords: ["roadmap", "path", "plan", "next"] },
  { id: "interest-map", keywords: ["strength", "interest", "subject"] },
  { id: "achievements", keywords: ["upload", "evidence", "achievement"] },
  { id: "career-match", keywords: ["career", "fit", "match"] },
  { id: "career-trial", keywords: ["trial", "simulate", "practice"] },
];

function OnboardingScreen({
  form,
  onChange,
  onDone,
}: {
  form: OnboardingForm;
  onChange: (field: keyof OnboardingForm, value: string) => void;
  onDone: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const progress = ((stepIndex + 1) / onboardingSteps.length) * 100;

  const continueStep = () => {
    if (isLastStep) {
      onDone();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  return (
    <main className="stage-screen">
      <section className="stage-card" aria-labelledby="onboarding-title">
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

          {step.type === "select" ? (
            <select
              autoFocus
              onChange={(event) => onChange(step.id, event.target.value)}
              value={form[step.id]}
            >
              {step.options?.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : step.type === "textarea" ? (
            <textarea
              autoFocus
              onChange={(event) => onChange(step.id, event.target.value)}
              placeholder={step.placeholder}
              rows={4}
              value={form[step.id]}
            />
          ) : (
            <input
              autoFocus
              onChange={(event) => onChange(step.id, event.target.value)}
              placeholder={step.placeholder}
              value={form[step.id]}
            />
          )}

          <div className="stage-actions">
            <button
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              Back
            </button>
            <button type="submit">{isLastStep ? "Choose guide" : "Continue"}</button>
          </div>
        </form>
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
  form,
  selectedCharacter,
}: {
  form: OnboardingForm;
  selectedCharacter: CharacterOption;
}) {
  const [command, setCommand] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [unlockedIslandIds, setUnlockedIslandIds] = useState<IslandId[]>([]);
  const startWorkspaceEntry = useCharacterStore(
    (state) => state.startWorkspaceEntry,
  );
  const openIsland = useIslandStore((state) => state.openIsland);
  const focusIsland = useIslandStore((state) => state.focusIsland);
  const openIslands = useIslandStore((state) => state.openIslands);
  const selectedGuide = useMemo(
    () =>
      characterOptions.find((option) => option.id === selectedCharacter) ??
      characterOptions[0],
    [selectedCharacter],
  );

  useEffect(() => {
    startWorkspaceEntry();
  }, [startWorkspaceEntry]);

  const revealIsland = (islandId: IslandId) => {
    setUnlockedIslandIds((current) =>
      current.includes(islandId) ? current : [...current, islandId],
    );

    if (openIslands[islandId]) {
      focusIsland(islandId);
      return;
    }

    openIsland(islandId);
  };

  const handleCommand = () => {
    const normalizedCommand = command.trim().toLowerCase();

    if (!normalizedCommand) {
      setProfileOpen(true);
      return;
    }

    const trigger = islandTriggers.find((item) =>
      item.keywords.some((keyword) => normalizedCommand.includes(keyword)),
    );

    if (trigger) {
      revealIsland(trigger.id);
      setCommand("");
      return;
    }

    setProfileOpen(true);
    setCommand("");
  };

  return (
    <main className="workspace-screen" aria-label="Ayna AI workspace">
      <div className="workspace-stage">
        <div className="workspace-brand">
          <span>Ayna AI</span>
          <strong>{selectedGuide.name} workspace</strong>
        </div>

        <WorkspacePlane>
          {profileOpen ? (
            <article className="profile-island">
              <span>Profile summary</span>
              <h2>{form.name || "Student"}</h2>
              <p>
                {form.gradeOrAge || "Grade not set"} ·{" "}
                {form.region || "Region not set"} · {form.englishLevel}
              </p>
              <strong>{form.interests || "Interests will appear here."}</strong>
            </article>
          ) : null}
          <IslandsLayer />
          <DesktopCharacter />
        </WorkspacePlane>

        {unlockedIslandIds.length > 0 ? (
          <nav className="workspace-nav" aria-label="Unlocked islands">
            {unlockedIslandIds.map((islandId) => (
              <button
                key={islandId}
                onClick={() => revealIsland(islandId)}
                type="button"
              >
                {islandId.replace("-", " ")}
              </button>
            ))}
          </nav>
        ) : null}

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
            placeholder="Ask Ayna to build your first roadmap"
            value={command}
          />
          <button type="submit">Send</button>
        </form>

        <p className="workspace-hint">
          Try: roadmap, strengths, upload evidence, career fit
        </p>
      </div>
    </main>
  );
}

function App() {
  const [phase, setPhase] = useState<AppPhase>("onboarding");
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterOption>("ayna");
  const [form, setForm] = useState<OnboardingForm>({
    name: "",
    gradeOrAge: "",
    region: "",
    englishLevel: "Intermediate",
    interests: "",
    challenge: "",
  });

  if (phase === "onboarding") {
    return (
      <OnboardingScreen
        form={form}
        onChange={(field, value) =>
          setForm((current) => ({ ...current, [field]: value }))
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

  return <WorkspaceScreen form={form} selectedCharacter={selectedCharacter} />;
}

export default App;
