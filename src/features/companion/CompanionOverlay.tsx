import { useEffect, useState } from "react";

type CompanionState = "idle" | "greet" | "hover" | "speaking" | "thinking" | "success" | "hidden";

const stateImageMap: Record<CompanionState, string> = {
  idle: "idle",
  greet: "greet",
  hover: "greet",
  speaking: "speaking",
  thinking: "thinking",
  success: "pointing",
  hidden: "idle",
};

const stateTextMap: Record<CompanionState, string> = {
  idle: "Click me.",
  greet: "Hi, I'm Lyra.",
  hover: "Need help?",
  speaking: "Choose a tool.",
  thinking: "Working...",
  success: "Done.",
  hidden: "",
};

const getDesktopApi = () =>
  typeof window !== "undefined" && (window as any).aynaDesktop
    ? (window as any).aynaDesktop
    : undefined;

export function CompanionOverlay() {
  const [state, setState] = useState<CompanionState>("greet");
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopApi = getDesktopApi();

  useEffect(() => {
    // Initial greet
    setTimeout(() => setState("idle"), 1200);
  }, []);

  useEffect(() => {
    const previousHtml = document.documentElement.style.background;
    const previousBodyBg = document.body.style.background;
    const previousBodyOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const previousRootBg = root?.style.background;

    document.documentElement.style.background = "transparent";
    document.documentElement.classList.add("companion-active");
    document.body.style.background = "transparent";
    document.body.style.overflow = "hidden";
    document.body.classList.add("companion-active");
    if (root) {
      root.style.background = "transparent";
      root.classList.add("companion-active");
    }

    return () => {
      document.documentElement.style.background = previousHtml;
      document.documentElement.classList.remove("companion-active");
      document.body.style.background = previousBodyBg;
      document.body.style.overflow = previousBodyOverflow;
      document.body.classList.remove("companion-active");
      if (root) {
        root.style.background = previousRootBg || "";
        root.classList.remove("companion-active");
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (state !== "thinking") setState("hover");
  };

  const handleMouseLeave = () => {
    if (state !== "thinking") setState("idle");
  };

  const handleClick = () => {
    setMenuOpen((current) => !current);
    setState("speaking");
    setTimeout(() => setState("idle"), 800);
  };

  const handleAction = (action: () => void) => {
    setState("thinking");
    action();
    setTimeout(() => {
      setState("success");
      setTimeout(() => setState("idle"), 700);
    }, 900);
  };

  const handleOpenMain = () => handleAction(() => {
    if (desktopApi?.openMain) {
      desktopApi.openMain();
    } else {
      console.log("aynaDesktop.openMain is unavailable");
    }
  });

  const handleCommand = (command: string) => handleAction(() => {
    if (desktopApi?.sendCompanionCommand) {
      desktopApi.sendCompanionCommand(command);
    } else {
      console.log("aynaDesktop.sendCompanionCommand is unavailable", command);
    }
  });

  const handleHide = () => {
    setState("hidden");
    setTimeout(() => {
      if (desktopApi?.hideCompanion) {
        desktopApi.hideCompanion();
      } else {
        console.log("aynaDesktop.hideCompanion is unavailable");
      }
    }, 200);
  };

  const imageSrc = `/characters/lyra/${stateImageMap[state]}.png`;

  return (
    <main className="companion-root" role="dialog" aria-label="Lyra companion overlay">
      <div className="companion-body">
        <div className="companion-card">
          <button
            type="button"
            className={`companion-lyra-button companion-avatar--${state}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            aria-expanded={menuOpen}
            aria-label="Toggle companion menu"
          >
            <img
              src={imageSrc}
              alt="Lyra companion"
              className="companion-lyra-image"
            />
          </button>

          {state !== "hidden" && (
            <div className="companion-speech-bubble">
              {stateTextMap[state]}
            </div>
          )}

          {menuOpen && (
            <div className="companion-radial-menu">
              <button
                type="button"
                className="companion-radial-button companion-radial-button--open"
                onClick={handleOpenMain}
                title="Open Ayna"
              >
                ✨
              </button>
              <button
                type="button"
                className="companion-radial-button companion-radial-button--roadmap"
                onClick={() => handleCommand("roadmap")}
                title="Build roadmap"
              >
                🛠
              </button>
              <button
                type="button"
                className="companion-radial-button companion-radial-button--upload"
                onClick={() => handleCommand("achievement-upload")}
                title="Upload achievement"
              >
                📤
              </button>
              <button
                type="button"
                className="companion-radial-button companion-radial-button--hide"
                onClick={handleHide}
                title="Hide"
              >
                👁
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
