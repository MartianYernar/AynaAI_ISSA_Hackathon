import type { StudentProfile } from "../../types";
import type { CharacterState } from "../../types";

export type WorkspaceNodeType =
  | "profile-summary"
  | "career-identity"
  | "interest-signal"
  | "roadmap-map-preview"
  | "interest-chart"
  | "career-table"
  | "roadmap-timeline"
  | "roadmap-map"
  | "achievement-evidence"
  | "opportunity-map";

export type WorkspaceNodeState = "visible" | "minimized";

export interface WorkspaceNodeSchema<TData = unknown> {
  id: string;
  type: WorkspaceNodeType;
  title: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  data: TData;
  state: WorkspaceNodeState;
}

export type WorkspaceModule<TData = unknown> = WorkspaceNodeSchema<TData>;

export interface WorkspaceEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export type WorkspaceEvent =
  | {
      id: string;
      type: "assistant_message";
      message: string;
    }
  | {
      id: string;
      type: "set_assistant_state";
      state: CharacterState;
    }
  | {
      id: string;
      type: "spawn_modules";
      modules: WorkspaceModule[];
    }
  | {
      id: string;
      type: "focus_module";
      moduleId: string;
    }
  | {
      id: string;
      type: "connect_modules";
      edges: WorkspaceEdge[];
    };

export interface WorkspaceCommandRequest {
  commandText: string;
  studentProfile: StudentProfile;
  existingModules: WorkspaceModule[];
  selectedCharacterId: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface WorkspaceCommandResponse {
  assistantMessage: string;
  assistantState: CharacterState;
  events: WorkspaceEvent[];
}

export interface WorkspaceNodeEvent {
  eventId: string;
  action: "spawn";
  node: WorkspaceNodeSchema;
}

export interface WorkspaceApiContext {
  profile: StudentProfile;
}
