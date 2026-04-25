export type IslandId =
  | "interest-map"
  | "achievements"
  | "roadmap"
  | "career-match"
  | "career-trial";

export type CharacterState =
  | "idle"
  | "greet"
  | "clicked"
  | "reacting"
  | "landing"
  | "walking"
  | "pointing"
  | "thinking"
  | "speaking"
  | "sitting";

export interface CharacterAnchor {
  x: number;
  y: number;
}

export interface CharacterRegistryEntry {
  id: string;
  manifest: string;
}

export interface CharacterManifest {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  accentColor?: string;
  scale?: number;
  anchor?: CharacterAnchor;
  states: Partial<Record<CharacterState, string>>;
  fallbackState: CharacterState;
  manifestUrl: string;
}

export interface IslandLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IslandContentItem {
  label: string;
  value: string;
}

export interface IslandDefinition {
  id: IslandId;
  title: string;
  eyebrow: string;
  summary: string;
  content: IslandContentItem[];
  layout: IslandLayout;
}

export interface CharacterPosition {
  x: number;
  y: number;
}

export interface StudentProfile {
  name: string;
  gradeOrAge: string;
  region: string;
  englishLevel: string;
  interests: string;
  challenge: string;
  hasAchievements: string;
}

export type WorkspaceModuleType =
  | "profile-summary"
  | "interest-bars"
  | "career-match-table"
  | "roadmap-timeline"
  | "achievement-evidence"
  | "opportunities-map";

interface WorkspaceModuleBase {
  id: string;
  type: WorkspaceModuleType;
  title: string;
  subtitle?: string;
}

export interface ProfileSummaryModule extends WorkspaceModuleBase {
  type: "profile-summary";
  student: {
    name: string;
    gradeOrAge: string;
    region: string;
    englishLevel: string;
  };
  focus: string[];
  nextPrompt: string;
}

export interface InterestBarsModule extends WorkspaceModuleBase {
  type: "interest-bars";
  interests: Array<{
    label: string;
    score: number;
    evidence: string;
  }>;
}

export interface CareerMatchTableModule extends WorkspaceModuleBase {
  type: "career-match-table";
  matches: Array<{
    role: string;
    fit: number;
    why: string;
    gap: string;
  }>;
}

export interface RoadmapTimelineModule extends WorkspaceModuleBase {
  type: "roadmap-timeline";
  milestones: Array<{
    phase: string;
    title: string;
    actions: string[];
    outcome: string;
  }>;
}

export interface AchievementEvidenceModule extends WorkspaceModuleBase {
  type: "achievement-evidence";
  evidence: Array<{
    source: string;
    strength: string;
    portfolioUse: string;
    confidence: "high" | "medium" | "low";
  }>;
}

export interface OpportunitiesMapModule extends WorkspaceModuleBase {
  type: "opportunities-map";
  regions: Array<{
    name: string;
    opportunityCount: number;
    category: string;
    note: string;
  }>;
}

export type WorkspaceModule =
  | ProfileSummaryModule
  | InterestBarsModule
  | CareerMatchTableModule
  | RoadmapTimelineModule
  | AchievementEvidenceModule
  | OpportunitiesMapModule;
