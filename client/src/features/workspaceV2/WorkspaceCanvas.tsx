import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
import { GraduationCap, GripVertical, ImagePlus, Mic, X } from "lucide-react";
import { DesktopCharacter } from "../../components/avatar";
import { ShiningText } from "../../components/ui/shining-text";
import { useOutputLanguage } from "../../context/LanguageContext";
import type { SessionBootstrapResponse } from "../../services/sessionApi";
import { useCharacterStore } from "../../store";
import type { StudentProfile } from "../../types";
import {
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  speechRecognitionLangForOutput,
  stopAyanaSpeech,
  type SpeechRecognition,
} from "./ayanaSpeech";
import {
  fileToWorkspaceImage,
  maxAttachments,
  type WorkspaceImageAttachment,
} from "./imageAttachmentUtils";
import { AdmissionsCheckerPanel } from "./AdmissionsCheckerPanel";
import { LanguageSwitch } from "./LanguageSwitch";
import { WorkspaceNodeRenderer } from "./WorkspaceNodeRenderer";
import { sendWorkspaceCommand } from "./workspaceCommandApi";
import type {
  WorkspaceCommandRequest,
  WorkspaceCommandResponse,
  WorkspaceEvent,
  WorkspaceModule,
  WorkspaceNodeSchema,
} from "./types";

interface WorkspaceCanvasProps {
  guideName: string;
  selectedCharacterId: string;
  profile: StudentProfile;
  aiBootstrap: SessionBootstrapResponse | null;
}

const nodeTypes: NodeTypes = {
  "workspace-node": WorkspaceNodeRenderer,
};

const LAYOUT_NUDGES_KEY = "ayna-workspace-layout-nudges";
/** @deprecated migrated into LAYOUT_NUDGES_KEY */
const LEGACY_BUDDY_NUDGE_KEY = "ayna-workspace-buddy-nudge";

type LayoutNudge = { x: number; y: number };

function parseNudge(value: unknown): LayoutNudge | null {
  if (
    value &&
    typeof value === "object" &&
    "x" in value &&
    "y" in value &&
    typeof (value as { x: unknown }).x === "number" &&
    typeof (value as { y: unknown }).y === "number"
  ) {
    return { x: (value as { x: number }).x, y: (value as { y: number }).y };
  }
  return null;
}

function readLayoutNudges(): { avatar: LayoutNudge; message: LayoutNudge } {
  const zero = { x: 0, y: 0 };
  try {
    const raw = sessionStorage.getItem(LAYOUT_NUDGES_KEY);
    if (raw) {
      const j = JSON.parse(raw) as unknown;
      if (j && typeof j === "object") {
        const avatar = parseNudge((j as { avatar?: unknown }).avatar);
        const message = parseNudge((j as { message?: unknown }).message);
        if (avatar && message) {
          return { avatar, message };
        }
      }
    }
    const legacyRaw = sessionStorage.getItem(LEGACY_BUDDY_NUDGE_KEY);
    if (legacyRaw) {
      const legacy = parseNudge(JSON.parse(legacyRaw) as unknown);
      if (legacy) {
        return { avatar: { ...legacy }, message: { ...legacy } };
      }
    }
  } catch {
    /* ignore */
  }
  return { avatar: zero, message: zero };
}

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
  aiBootstrap,
}: WorkspaceCanvasProps) {
  const [command, setCommand] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [isPreparingResponse, setIsPreparingResponse] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    WorkspaceCommandRequest["conversationHistory"]
  >([]);
  const [attachments, setAttachments] = useState<WorkspaceImageAttachment[]>(
    [],
  );
  const [isListening, setIsListening] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const attachmentsRef = useRef<WorkspaceImageAttachment[]>([]);
  attachmentsRef.current = attachments;
  const [admissionsOpen, setAdmissionsOpen] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const eventTimeoutsRef = useRef<number[]>([]);
  const startWorkspaceEntry = useCharacterStore(
    (state) => state.startWorkspaceEntry,
  );
  const setCharacterPosition = useCharacterStore((state) => state.setPosition);
  const setCharacterState = useCharacterStore((state) => state.setState);
  const { outputLanguage } = useOutputLanguage();

  const initialLayout = readLayoutNudges();
  const [avatarNudge, setAvatarNudge] = useState(initialLayout.avatar);
  const [messageNudge, setMessageNudge] = useState(initialLayout.message);
  const [layoutDragging, setLayoutDragging] = useState(false);
  const avatarNudgeRef = useRef(avatarNudge);
  const messageNudgeRef = useRef(messageNudge);
  avatarNudgeRef.current = avatarNudge;
  messageNudgeRef.current = messageNudge;
  const layoutDragKindRef = useRef<"avatar" | "message" | null>(null);
  const layoutDragRef = useRef<{
    clientX: number;
    clientY: number;
    start: LayoutNudge;
  } | null>(null);

  const beginAvatarDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      layoutDragKindRef.current = "avatar";
      layoutDragRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        start: { ...avatarNudgeRef.current },
      };
      setLayoutDragging(true);
    },
    [],
  );

  const beginMessageDrag = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      layoutDragKindRef.current = "message";
      layoutDragRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        start: { ...messageNudgeRef.current },
      };
      setLayoutDragging(true);
    },
    [],
  );

  const dismissAssistantBubble = useCallback(() => {
    stopAyanaSpeech();
    setAssistantMessage("");
    setIsPreparingResponse(false);
    setCharacterState("idle");
  }, [setCharacterState]);

  useEffect(() => {
    if (!layoutDragging) {
      return;
    }
    const onMove = (e: PointerEvent) => {
      const d = layoutDragRef.current;
      const kind = layoutDragKindRef.current;
      if (!d || !kind) {
        return;
      }
      const next: LayoutNudge = {
        x: d.start.x + e.clientX - d.clientX,
        y: d.start.y + e.clientY - d.clientY,
      };
      if (kind === "avatar") {
        avatarNudgeRef.current = next;
        setAvatarNudge(next);
      } else {
        messageNudgeRef.current = next;
        setMessageNudge(next);
      }
    };
    const end = () => {
      layoutDragRef.current = null;
      layoutDragKindRef.current = null;
      setLayoutDragging(false);
      try {
        sessionStorage.setItem(
          LAYOUT_NUDGES_KEY,
          JSON.stringify({
            avatar: avatarNudgeRef.current,
            message: messageNudgeRef.current,
          }),
        );
        sessionStorage.removeItem(LEGACY_BUDDY_NUDGE_KEY);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [layoutDragging]);

  useEffect(() => {
    document.body.style.cursor = layoutDragging ? "grabbing" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [layoutDragging]);

  useEffect(() => {
    const r = createSpeechRecognition();
    if (!r) {
      return;
    }
    r.onresult = (ev) => {
      const line = ev.results[0]?.[0]?.transcript?.trim() ?? "";
      if (line) {
        setCommand((current) =>
          current.trim() ? `${current.trim()} ${line}` : line,
        );
      }
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    return () => {
      try {
        r.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  useEffect(() => {
    const r = recognitionRef.current;
    if (r) {
      r.lang = speechRecognitionLangForOutput(outputLanguage);
    }
  }, [outputLanguage]);

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
      let maxSpawnInEvent = 0;

      existingModules.forEach((module) => {
        moduleLookup.set(module.id, module);
      });

      events.forEach((event) => {
        if (event.type === "spawn_modules" && Array.isArray(event.modules)) {
          maxSpawnInEvent = Math.max(maxSpawnInEvent, event.modules.length);
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
            if (!Array.isArray(event.modules) || event.modules.length === 0) {
              return;
            }
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
        delay +=
          event.type === "spawn_modules" && Array.isArray(event.modules)
            ? event.modules.length * 360
            : 260;
      });

      const doneTimeoutId = window.setTimeout(() => {
        setCharacterState("idle");
        flowInstanceRef.current?.fitView({
          duration: 520,
          maxZoom: 1.35,
          minZoom: 0.28,
          padding: 0.22,
        });
      }, delay + 320 + maxSpawnInEvent * 360);

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

  const applyAdmissionsResponse = useCallback(
    (response: WorkspaceCommandResponse) => {
      setAssistantMessage(response.assistantMessage);
      setCharacterState(response.assistantState);
      setConversationHistory((current) => [
        ...(current ?? []),
        {
          role: "user",
          content: "[University readiness: targets & achievements]",
        },
        { role: "assistant", content: response.assistantMessage },
      ]);
      try {
        processEvents(response.events);
      } catch (err) {
        console.error("admissions processEvents failed", err);
        setAssistantMessage(
          "Blocks could not be placed on the canvas. Try again.",
        );
      }
    },
    [processEvents, setCharacterState],
  );

  const submitWorkspaceCommand = useCallback(
    async (
      commandText: string,
      attachmentPayload: WorkspaceImageAttachment[] = [],
    ) => {
      setIsPreparingResponse(true);
      setAssistantMessage("Ayana is generating a workspace response...");
      setCharacterState("thinking");

      const trimmed = commandText.trim();
      const textForApi =
        trimmed ||
        (attachmentPayload.length > 0 ? "(see attached image)" : "");
      const userHistoryLine =
        trimmed ||
        (attachmentPayload.length > 0
          ? `[${attachmentPayload.length} image(s) attached]`
          : "");

      try {
        const response = await sendWorkspaceCommand({
          commandText: textForApi,
          studentProfile: profile,
          existingModules,
          selectedCharacterId,
          aiBootstrap,
          conversationHistory,
          outputLanguage,
          attachments:
            attachmentPayload.length > 0
              ? attachmentPayload.map(({ mimeType, dataBase64 }) => ({
                  mimeType,
                  dataBase64,
                }))
              : undefined,
        });

        setAssistantMessage(response.assistantMessage);
        setCharacterState(response.assistantState);
        attachmentPayload.forEach((a) => URL.revokeObjectURL(a.previewUrl));
        setAttachments([]);
        setConversationHistory((current) => [
          ...(current ?? []),
          { role: "user", content: userHistoryLine },
          { role: "assistant", content: response.assistantMessage },
        ]);
        try {
          processEvents(response.events);
        } catch (err) {
          console.error("processEvents failed", err);
          setAssistantMessage(
            "Something went wrong updating the canvas. Try again.",
          );
        }
      } catch (err) {
        console.error("sendWorkspaceCommand failed", err);
        setAssistantMessage(
          "Ayana could not finish that request. Check the API, then try again.",
        );
        setCharacterState("idle");
      } finally {
        setIsPreparingResponse(false);
      }
    },
    [
      conversationHistory,
      existingModules,
      processEvents,
      profile,
      selectedCharacterId,
      aiBootstrap,
      outputLanguage,
      setCharacterState,
    ],
  );

  const submitWorkspaceCommandRef = useRef(submitWorkspaceCommand);
  submitWorkspaceCommandRef.current = submitWorkspaceCommand;

  useEffect(() => {
    startWorkspaceEntry();
    setCharacterPosition(168, Math.max(500, window.innerHeight - 72));
    void submitWorkspaceCommandRef.current("__start__");

    return () => {
      clearEventTimeouts();
    };
  }, [clearEventTimeouts, setCharacterPosition, startWorkspaceEntry]);

  useEffect(
    () => () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    },
    [],
  );

  const submitCommand = () => {
    if (!command.trim() && attachments.length === 0) {
      return;
    }
    const snapshot = [...attachments];
    const text = command;
    setCommand("");
    void submitWorkspaceCommand(text, snapshot);
  };

  const toggleVoiceInput = () => {
    const r = recognitionRef.current;
    if (!isSpeechRecognitionSupported() || !r) {
      setSpeechHint("Voice typing needs Chrome, Edge, or Safari.");
      return;
    }
    setSpeechHint(null);
    if (isListening) {
      try {
        r.stop();
      } catch {
        /* ignore */
      }
      setIsListening(false);
      return;
    }
    try {
      r.start();
      setIsListening(true);
    } catch {
      setSpeechHint("Microphone could not start. Check permissions.");
      setIsListening(false);
    }
  };

  const onAttachmentFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    let next = [...attachments];
    for (const file of files) {
      if (next.length >= maxAttachments()) {
        break;
      }
      try {
        const att = await fileToWorkspaceImage(file);
        next = [...next, att];
      } catch (e) {
        console.warn(e);
        setSpeechHint(
          e instanceof Error ? e.message : "Could not add that image.",
        );
      }
    }
    setAttachments(next);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const found = current.find((a) => a.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return current.filter((a) => a.id !== id);
    });
  };

  return (
    <section className="workspace-v2" aria-label="Ayna canvas workspace">
      <div className="workspace-v2-topbar">
        <div>
          <span>Ayna AI</span>
          <strong>{guideName} canvas</strong>
        </div>
        <nav aria-label="Workspace tools" className="workspace-v2-topbar-tools">
          <LanguageSwitch />
          <button
            className="workspace-v2-topbar-admissions"
            onClick={() => setAdmissionsOpen(true)}
            type="button"
          >
            <GraduationCap size={18} strokeWidth={1.75} aria-hidden />
            University readiness
          </button>
        </nav>
      </div>

      <AdmissionsCheckerPanel
        existingModuleIds={nodes.map((n) => n.id)}
        isOpen={admissionsOpen}
        onClose={() => setAdmissionsOpen(false)}
        onResult={applyAdmissionsResponse}
        outputLanguage={outputLanguage}
        profile={profile}
        setAssistantLoading={(msg) => {
          if (msg) {
            setIsPreparingResponse(true);
            setAssistantMessage(msg);
            setCharacterState("thinking");
          } else {
            setIsPreparingResponse(false);
          }
        }}
      />

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
        <div
          className="workspace-v2-companion-nudge"
          style={{
            transform: `translate(${avatarNudge.x}px, ${avatarNudge.y}px)`,
          }}
        >
          <button
            aria-label="Drag to move Ayana"
            className="workspace-v2-avatar-move-handle"
            onPointerDown={beginAvatarDrag}
            type="button"
          >
            <GripVertical aria-hidden size={18} strokeWidth={2} />
          </button>
          <DesktopCharacter />
        </div>
      </div>

      {assistantMessage ? (
        <div
          className="workspace-v2-message"
          role="status"
          style={{
            transform: `translate(${messageNudge.x}px, ${messageNudge.y}px)`,
          }}
        >
          <div className="workspace-v2-message-toolbar">
            <button
              aria-label="Drag to move message"
              className="workspace-v2-message-drag"
              onPointerDown={beginMessageDrag}
              type="button"
            >
              <GripVertical aria-hidden size={16} strokeWidth={2} />
            </button>
            <button
              aria-label="Dismiss message"
              className="workspace-v2-message-close"
              onClick={dismissAssistantBubble}
              type="button"
            >
              <X aria-hidden size={16} strokeWidth={2} />
            </button>
          </div>
          <div className="workspace-v2-message-body">
            {isPreparingResponse ? (
              <ShiningText text={assistantMessage} />
            ) : (
              assistantMessage
            )}
          </div>
        </div>
      ) : null}

      <form
        className="workspace-v2-command"
        onSubmit={(event) => {
          event.preventDefault();
          submitCommand();
        }}
      >
        {attachments.length > 0 ? (
          <div className="workspace-v2-command-attachments">
            {attachments.map((a) => (
              <div className="workspace-v2-attach-thumb" key={a.id}>
                <img alt="" src={a.previewUrl} />
                <button
                  aria-label="Remove image"
                  onClick={() => removeAttachment(a.id)}
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className="workspace-v2-command-row">
          <input
            accept="image/*"
            className="workspace-v2-file-input"
            multiple
            onChange={onAttachmentFiles}
            ref={fileInputRef}
            tabIndex={-1}
            type="file"
          />
          <button
            aria-label="Attach images"
            className="workspace-v2-command-tool"
            onClick={() => fileInputRef.current?.click()}
            title="Attach images"
            type="button"
          >
            <ImagePlus size={18} strokeWidth={1.8} />
          </button>
          <input
            aria-label="Message Ayana"
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Ask anything — or attach a screenshot for Ayana to read"
            value={command}
          />
          <button
            aria-label={isListening ? "Stop voice input" : "Voice input"}
            aria-pressed={isListening}
            className={`workspace-v2-command-tool${isListening ? " is-listening" : ""}`}
            onClick={toggleVoiceInput}
            title="Voice input"
            type="button"
          >
            <Mic size={18} strokeWidth={1.8} />
          </button>
          <button className="workspace-v2-command-submit" type="submit">
            Send
          </button>
        </div>
        {speechHint ? (
          <p className="workspace-v2-command-hint">{speechHint}</p>
        ) : null}
      </form>
    </section>
  );
}
