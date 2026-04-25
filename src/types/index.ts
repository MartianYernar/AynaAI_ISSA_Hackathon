export type IslandId =
  | "interest-map"
  | "achievements"
  | "roadmap"
  | "career-match"
  | "career-trial";

export type CharacterState =
  | "idle"
  | "walking"
  | "pointing"
  | "thinking"
  | "speaking";

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
