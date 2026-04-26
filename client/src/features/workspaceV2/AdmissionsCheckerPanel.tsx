import { GraduationCap, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { OutputLanguage } from "../../i18n/outputLanguage";
import type { StudentProfile } from "../../types";
import { fetchAdmissionsReadiness } from "./admissionsApi";
import {
  fileToWorkspaceImage,
  maxAttachments,
  type WorkspaceImageAttachment,
} from "./imageAttachmentUtils";
import type { WorkspaceCommandResponse } from "./types";

type AdmissionsCheckerPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  existingModuleIds: string[];
  outputLanguage: OutputLanguage;
  onResult: (response: WorkspaceCommandResponse) => void;
  setAssistantLoading: (message: string | null) => void;
};

export function AdmissionsCheckerPanel({
  isOpen,
  onClose,
  profile,
  existingModuleIds,
  outputLanguage,
  onResult,
  setAssistantLoading,
}: AdmissionsCheckerPanelProps) {
  const [achievementsText, setAchievementsText] = useState("");
  const [targetUniversities, setTargetUniversities] = useState("");
  const [targetMajors, setTargetMajors] = useState("");
  const [cvAttachments, setCvAttachments] = useState<WorkspaceImageAttachment[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<WorkspaceImageAttachment[]>([]);
  cvRef.current = cvAttachments;

  useEffect(
    () => () => {
      cvRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const onCvFiles = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    let next = [...cvAttachments];
    for (const file of files) {
      if (next.length >= maxAttachments()) {
        break;
      }
      try {
        const att = await fileToWorkspaceImage(file);
        next = [...next, att];
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not read file");
      }
    }
    setCvAttachments(next);
  }, [cvAttachments]);

  const removeCv = (id: string) => {
    setCvAttachments((current) => {
      const found = current.find((a) => a.id === id);
      if (found) {
        URL.revokeObjectURL(found.previewUrl);
      }
      return current.filter((a) => a.id !== id);
    });
  };

  const submit = async () => {
    setError(null);
    if (!targetUniversities.trim()) {
      setError("Add at least one university you are aiming for.");
      return;
    }
    if (!achievementsText.trim() && cvAttachments.length === 0) {
      setError("Paste your achievements or CV text, or attach a CV image.");
      return;
    }
    setAssistantLoading("Ayana is analyzing your profile for admissions…");
    try {
      const res = await fetchAdmissionsReadiness({
        profile,
        achievementsText,
        targetUniversities,
        targetMajors,
        attachments: cvAttachments,
        existingModuleIds,
        outputLanguage,
      });
      cvAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
      setCvAttachments([]);
      onResult(res);
      onClose();
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Request failed. Try again shortly.",
      );
    } finally {
      setAssistantLoading(null);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="admissions-panel-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="admissions-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="admissions-panel-title"
        aria-modal="true"
      >
        <header className="admissions-panel-header">
          <div className="admissions-panel-title-wrap">
            <GraduationCap size={22} strokeWidth={1.7} aria-hidden />
            <div>
              <h2 id="admissions-panel-title">University readiness</h2>
              <p>
                Illustrative admission bands + an honest read on your achievements
                (not official odds).
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="admissions-panel-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </header>

        <div className="admissions-panel-body">
          <label className="admissions-field">
            <span>Achievements & activities (or paste CV text)</span>
            <textarea
              onChange={(e) => setAchievementsText(e.target.value)}
              placeholder="Competitions, projects, grades, leadership, jobs, research…"
              rows={5}
              value={achievementsText}
            />
          </label>

          <label className="admissions-field">
            <span>Target universities</span>
            <textarea
              onChange={(e) => setTargetUniversities(e.target.value)}
              placeholder="e.g. MIT, Stanford, local polytechnic — list all that matter"
              rows={2}
              value={targetUniversities}
            />
          </label>

          <label className="admissions-field">
            <span>Major(s) / field</span>
            <textarea
              onChange={(e) => setTargetMajors(e.target.value)}
              placeholder="e.g. Computer Science + minor in Design"
              rows={2}
              value={targetMajors}
            />
          </label>

          <div className="admissions-cv-block">
            <span className="admissions-cv-label">CV / portfolio (images)</span>
            <p className="admissions-cv-hint">
              Screenshots or photos of a résumé work best. Up to {maxAttachments()}{" "}
              images.
            </p>
            <input
              accept="image/*"
              className="workspace-v2-file-input"
              multiple
              onChange={onCvFiles}
              ref={cvInputRef}
              tabIndex={-1}
              type="file"
            />
            <button
              className="admissions-cv-button"
              onClick={() => cvInputRef.current?.click()}
              type="button"
            >
              Add images
            </button>
            {cvAttachments.length > 0 ? (
              <div className="admissions-cv-thumbs">
                {cvAttachments.map((a) => (
                  <div className="workspace-v2-attach-thumb" key={a.id}>
                    <img alt="" src={a.previewUrl} />
                    <button
                      aria-label="Remove"
                      onClick={() => removeCv(a.id)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {error ? <p className="admissions-panel-error">{error}</p> : null}

          <div className="admissions-panel-actions">
            <button onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="admissions-panel-primary"
              onClick={() => void submit()}
              type="button"
            >
              Generate blocks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
