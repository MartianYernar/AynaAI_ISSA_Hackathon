import type { IslandDefinition } from "../types";

export const islandDefinitions: IslandDefinition[] = [
  {
    id: "interest-map",
    title: "Interest Map",
    eyebrow: "Signals",
    summary: "A compact view of what the student naturally gravitates toward.",
    layout: { x: 64, y: 84, width: 330, height: 280 },
    content: [
      { label: "Strongest pull", value: "Human-centered technology" },
      { label: "Secondary theme", value: "Research, storytelling, systems" },
      { label: "Energy marker", value: "High curiosity, medium structure" },
    ],
  },
  {
    id: "achievements",
    title: "Achievements",
    eyebrow: "Evidence",
    summary: "Portfolio moments translated into visible strengths.",
    layout: { x: 84, y: 400, width: 360, height: 260 },
    content: [
      { label: "Hackathon", value: "Built a prototype under a hard deadline" },
      { label: "Team role", value: "Frontend ownership and product polish" },
      { label: "Pattern", value: "Turns ambiguous ideas into demos" },
    ],
  },
  {
    id: "roadmap",
    title: "Roadmap",
    eyebrow: "Next 90 days",
    summary: "A pragmatic path from current skill to career-ready proof.",
    layout: { x: 504, y: 112, width: 380, height: 320 },
    content: [
      { label: "Month 1", value: "Ship one complete React desktop flow" },
      { label: "Month 2", value: "Add Tauri APIs and local persistence" },
      { label: "Month 3", value: "Package a polished case study" },
    ],
  },
  {
    id: "career-match",
    title: "Career Match",
    eyebrow: "Fit",
    summary: "Roles that match interests, evidence, and preferred work style.",
    layout: { x: 946, y: 96, width: 350, height: 292 },
    content: [
      { label: "Primary", value: "Product-minded frontend engineer" },
      { label: "Adjacent", value: "UX engineer, creative technologist" },
      { label: "Watch for", value: "Roles with real user-facing ownership" },
    ],
  },
  {
    id: "career-trial",
    title: "Career Trial",
    eyebrow: "Simulation",
    summary: "A short challenge that previews the actual work of the role.",
    layout: { x: 900, y: 438, width: 380, height: 282 },
    content: [
      { label: "Scenario", value: "Design a student onboarding mirror" },
      { label: "Task", value: "Explain one tradeoff and improve the UI" },
      { label: "Signal", value: "Tests product judgment, speed, clarity" },
    ],
  },
];
