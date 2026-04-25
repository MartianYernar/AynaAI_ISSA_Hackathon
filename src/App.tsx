import { DesktopCharacter } from "./components/avatar";
import { FullscreenScene } from "./components/camera";
import { CommandBar } from "./components/command";
import { IslandNav, IslandsLayer } from "./components/islands";
import { WorkspacePlane } from "./components/scene/WorkspacePlane";
import { useCharacterStore, useIslandStore } from "./store";
import type { IslandId } from "./types";
import { useState } from "react";
import "./styles/globals.css";

type AppPhase = "onboarding" | "character-selection" | "workspace";
type CharacterOption = "ayna" | "mentor" | "guide";

interface OnboardingForm {
  name: string;
  ageOrGrade: string;
  region: string;
  englishLevel: string;
  interests: string;
}

const characterOptions: Array<{
  id: CharacterOption;
  name: string;
  description: string;
}> = [
  {
    id: "ayna",
    name: "Ayna",
    description: "Calm mirror guide",
  },
  {
    id: "mentor",
    name: "Mentor",
    description: "Practical next-step coach",
  },
  {
    id: "guide",
    name: "Guide",
    description: "Quiet exploration partner",
  },
];

function App() {
  const [phase, setPhase] = useState<AppPhase>("onboarding");
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterOption>("ayna");
  const [onboardingForm, setOnboardingForm] = useState<OnboardingForm>({
    name: "",
    ageOrGrade: "",
    region: "",
    englishLevel: "Intermediate",
    interests: "",
  });
  const openIsland = useIslandStore((state) => state.openIsland);
  const walkToIsland = useCharacterStore((state) => state.walkToIsland);
  const pointAtIsland = useCharacterStore((state) => state.pointAtIsland);
  const moveTo = useCharacterStore((state) => state.moveTo);
  const startWorkspaceEntry = useCharacterStore(
    (state) => state.startWorkspaceEntry,
  );

  const handleOpenIsland = (islandId: IslandId) => {
    openIsland(islandId);

    if (islandId === "roadmap") {
      walkToIsland(islandId);
      return;
    }

    if (islandId === "achievements") {
      pointAtIsland(islandId);
      return;
    }

    if (islandId === "career-trial") {
      moveTo(980, 690);
    }
  };

  if (phase === "onboarding") {
    return (
      <main className="flow-screen">
        <section
          className="flow-panel onboarding-panel"
          aria-labelledby="onboarding-title"
        >
          <div className="flow-heading">
            <span>Ayna AI</span>
            <h1 id="onboarding-title">Tell Ayna who you are</h1>
            <p>
              A few basics help shape your career mirror before the workspace
              opens.
            </p>
          </div>
          <form
            className="onboarding-form"
            onSubmit={(event) => {
              event.preventDefault();
              setPhase("character-selection");
            }}
          >
            <label>
              <span>Name</span>
              <input
                autoComplete="name"
                onChange={(event) =>
                  setOnboardingForm((form) => ({
                    ...form,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
                value={onboardingForm.name}
              />
            </label>
            <label>
              <span>Age or grade</span>
              <input
                onChange={(event) =>
                  setOnboardingForm((form) => ({
                    ...form,
                    ageOrGrade: event.target.value,
                  }))
                }
                placeholder="16, Grade 10, first year"
                value={onboardingForm.ageOrGrade}
              />
            </label>
            <label>
              <span>Region</span>
              <input
                autoComplete="address-level1"
                onChange={(event) =>
                  setOnboardingForm((form) => ({
                    ...form,
                    region: event.target.value,
                  }))
                }
                placeholder="City or region"
                value={onboardingForm.region}
              />
            </label>
            <label>
              <span>English level</span>
              <select
                onChange={(event) =>
                  setOnboardingForm((form) => ({
                    ...form,
                    englishLevel: event.target.value,
                  }))
                }
                value={onboardingForm.englishLevel}
              >
                <option>Beginner</option>
                <option>Elementary</option>
                <option>Intermediate</option>
                <option>Upper-intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="onboarding-wide-field">
              <span>Favorite subjects or interests</span>
              <textarea
                onChange={(event) =>
                  setOnboardingForm((form) => ({
                    ...form,
                    interests: event.target.value,
                  }))
                }
                placeholder="Optional: design, biology, business, games"
                rows={3}
                value={onboardingForm.interests}
              />
            </label>
            <button type="submit">Continue</button>
          </form>
        </section>
      </main>
    );
  }

  if (phase === "character-selection") {
    return (
      <main className="flow-screen">
        <section
          className="flow-panel character-selection-panel"
          aria-labelledby="character-title"
        >
          <div className="flow-heading">
            <span>Choose guide</span>
            <h1 id="character-title">Select your character</h1>
            <p>
              Pick the guide style that should walk through the workspace with
              you.
            </p>
          </div>
          <div className="character-carousel" aria-label="Character options">
            {characterOptions.map((option) => (
              <button
                className={
                  selectedCharacter === option.id ? "is-selected" : undefined
                }
                key={option.id}
                onClick={() => setSelectedCharacter(option.id)}
                type="button"
              >
                <span className="character-preview" aria-hidden="true">
                  <span />
                </span>
                <strong>{option.name}</strong>
                <small>{option.description}</small>
              </button>
            ))}
          </div>
          <div className="character-selection-footer">
            <span>
              Selected:{" "}
              {
                characterOptions.find(
                  (option) => option.id === selectedCharacter,
                )?.name
              }
            </span>
            <button
              onClick={() => {
                startWorkspaceEntry();
                setPhase("workspace");
              }}
              type="button"
            >
              Continue
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <FullscreenScene>
      <WorkspacePlane>
        <IslandsLayer />
        <DesktopCharacter />
      </WorkspacePlane>
      <IslandNav onOpenIsland={handleOpenIsland} />
      <CommandBar onOpenIsland={handleOpenIsland} />
    </FullscreenScene>
  );
}

export default App;
