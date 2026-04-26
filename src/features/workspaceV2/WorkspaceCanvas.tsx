import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DesktopCharacter } from "../../components/avatar";
import { useCharacterStore } from "../../store";
import type { StudentProfile } from "../../types";
import { WorkspaceNodeRenderer } from "./WorkspaceNodeRenderer";
import { sendWorkspaceCommand } from "./workspaceCommandApi";
import type {
  WorkspaceCommandRequest,
  WorkspaceEvent,
  WorkspaceModule,
  WorkspaceNodeSchema,
} from "./types";

interface WorkspaceCanvasProps {
  guideName: string;
  selectedCharacterId: string;
  profile: StudentProfile;
}

const nodeTypes: NodeTypes = {
  "workspace-node": WorkspaceNodeRenderer,
};

function toFlowNode(
  workspaceNode: WorkspaceNodeSchema,
  handlers: {
    onHide: (id: string) => void;
    onMinimize: (id: string) => void;
  },
): Node {
  return {
    id: workspaceNode.id,
    type: "workspace-node",
    position: workspaceNode.position,
    data: {
      workspaceNode,
      onHide: handlers.onHide,
      onMinimize: handlers.onMinimize,
    },
    draggable: true,
  };
}

export function WorkspaceCanvas({
  guideName,
  profile,
  selectedCharacterId,
}: WorkspaceCanvasProps) {
  const [command, setCommand] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    WorkspaceCommandRequest["conversationHistory"]
  >([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const eventTimeoutsRef = useRef<number[]>([]);
  const startedRef = useRef(false);
  const startWorkspaceEntry = useCharacterStore(
    (state) => state.startWorkspaceEntry,
  );
  const setCharacterPosition = useCharacterStore((state) => state.setPosition);
  const setCharacterState = useCharacterStore((state) => state.setState);

  const clearEventTimeouts = useCallback(() => {
    eventTimeoutsRef.current.forEach((timeoutId) =>
      window.clearTimeout(timeoutId),
    );
    eventTimeoutsRef.current = [];
  }, []);

  const hideNode = useCallback(
    (id: string) => {
      setNodes((currentNodes) =>
        currentNodes.filter((node) => node.id !== id),
      );
    },
    [setNodes],
  );

  const minimizeNode = useCallback(
    (id: string) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== id) {
            return node;
          }

          const workspaceNode = node.data.workspaceNode as WorkspaceNodeSchema;
          const nextWorkspaceNode: WorkspaceNodeSchema = {
            ...workspaceNode,
            state:
              workspaceNode.state === "minimized" ? "visible" : "minimized",
          };

          return {
            ...node,
            data: {
              ...node.data,
              workspaceNode: nextWorkspaceNode,
            },
          };
        }),
      );
    },
    [setNodes],
  );

  const handlers = useMemo(
    () => ({
      onHide: hideNode,
      onMinimize: minimizeNode,
    }),
    [hideNode, minimizeNode],
  );

  const existingModules = useMemo(
    () =>
      nodes.map(
        (node) => node.data.workspaceNode as WorkspaceModule,
      ),
    [nodes],
  );

  const spawnModules = useCallback(
    (modules: WorkspaceModule[], baseDelay: number) => {
      modules.forEach((module, index) => {
        const timeoutId = window.setTimeout(() => {
          setNodes((currentNodes) => {
            if (currentNodes.some((node) => node.id === module.id)) {
              return currentNodes;
            }

            return [...currentNodes, toFlowNode(module, handlers)];
          });
        }, baseDelay + index * 360);

        eventTimeoutsRef.current.push(timeoutId);
      });
    },
    [handlers, setNodes],
  );

  const processEvents = useCallback(
    (events: WorkspaceEvent[]) => {
      clearEventTimeouts();

      let delay = 0;
      const moduleLookup = new Map<string, WorkspaceModule>();

      existingModules.forEach((module) => {
        moduleLookup.set(module.id, module);
      });

      events.forEach((event) => {
        if (event.type === "spawn_modules") {
          event.modules.forEach((module) => {
            moduleLookup.set(module.id, module);
          });
        }
      });

      events.forEach((event) => {
        const timeoutId = window.setTimeout(() => {
          if (event.type === "assistant_message") {
            setAssistantMessage(event.message);
            setCharacterState("speaking");
            return;
          }

          if (event.type === "set_assistant_state") {
            setCharacterState(event.state);
            return;
          }

          if (event.type === "spawn_modules") {
            spawnModules(event.modules, 0);
            return;
          }

          if (event.type === "focus_module") {
            const workspaceNode = moduleLookup.get(event.moduleId);

            if (workspaceNode) {
              flowInstanceRef.current?.setCenter(
                workspaceNode.position.x + workspaceNode.size.width / 2,
                workspaceNode.position.y + workspaceNode.size.height / 2,
                { duration: 520, zoom: 0.9 },
              );
            }
            return;
          }

          if (event.type === "connect_modules") {
            setEdges((currentEdges) => {
              const nextEdges = event.edges
                .filter(
                  (edge) =>
                    !currentEdges.some((currentEdge) => currentEdge.id === edge.id),
                )
                .map<Edge>((edge) => ({
                  id: edge.id,
                  source: edge.source,
                  target: edge.target,
                  label: edge.label,
                  animated: true,
                  className: "workspace-v2-edge",
                }));

              return [...currentEdges, ...nextEdges];
            });
          }
        }, delay);

        eventTimeoutsRef.current.push(timeoutId);
        delay += event.type === "spawn_modules" ? event.modules.length * 360 : 260;
      });

      const doneTimeoutId = window.setTimeout(() => {
        setCharacterState("idle");
      }, delay + 320);

      eventTimeoutsRef.current.push(doneTimeoutId);
    },
    [
      clearEventTimeouts,
      existingModules,
      setCharacterState,
      setEdges,
      spawnModules,
    ],
  );

  const submitWorkspaceCommand = useCallback(
    async (commandText: string) => {
      setCharacterState("thinking");

      const response = await sendWorkspaceCommand({
        commandText,
        studentProfile: profile,
        existingModules,
        selectedCharacterId,
        conversationHistory,
      });

      setAssistantMessage(response.assistantMessage);
      setCharacterState(response.assistantState);
      setConversationHistory((current) => [
        ...(current ?? []),
        { role: "user", content: commandText },
        { role: "assistant", content: response.assistantMessage },
      ]);
      processEvents(response.events);
    },
    [
      conversationHistory,
      existingModules,
      processEvents,
      profile,
      selectedCharacterId,
      setCharacterState,
    ],
  );

  useEffect(() => {
    if (startedRef.current) {
      return clearEventTimeouts;
    }

    startedRef.current = true;
    startWorkspaceEntry();
    setCharacterPosition(132, Math.max(420, window.innerHeight - 104));
    void submitWorkspaceCommand("__start__");

    return clearEventTimeouts;
  }, [
    clearEventTimeouts,
    setCharacterPosition,
    startWorkspaceEntry,
    submitWorkspaceCommand,
  ]);

  const submitCommand = () => {
    void submitWorkspaceCommand(command);
    setCommand("");
  };

  return (
    <section className="workspace-v2" aria-label="Ayna canvas workspace">
      <div className="workspace-v2-topbar">
        <div>
          <span>Ayna AI</span>
          <strong>{guideName} canvas</strong>
        </div>
        <nav aria-label="Workspace commands">
          <button onClick={() => void submitWorkspaceCommand("roadmap")} type="button">
            Roadmap
          </button>
          <button onClick={() => void submitWorkspaceCommand("careers")} type="button">
            Careers
          </button>
          <button onClick={() => void submitWorkspaceCommand("achievements")} type="button">
            Achievements
          </button>
        </nav>
      </div>

      <ReactFlow
        fitView
        edges={edges}
        maxZoom={1.45}
        minZoom={0.35}
        nodes={nodes}
        nodeTypes={nodeTypes}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => {
          flowInstanceRef.current = instance;
        }}
        onNodesChange={onNodesChange}
        panOnDrag
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8d2e7" gap={34} size={1.3} />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>

      <div className="workspace-v2-companion">
        <DesktopCharacter />
      </div>

      {assistantMessage ? (
        <div className="workspace-v2-message" role="status">
          {assistantMessage}
        </div>
      ) : null}

      <form
        className="workspace-v2-command"
        onSubmit={(event) => {
          event.preventDefault();
          submitCommand();
        }}
      >
        <input
          aria-label="Ask Lyra"
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Type roadmap, careers, or achievements"
          value={command}
        />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
