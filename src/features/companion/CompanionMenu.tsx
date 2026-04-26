interface CompanionMenuProps {
  onOpenAyna: () => void;
  onBuildRoadmap: () => void;
  onUploadAchievement: () => void;
  onHide: () => void;
}

export function CompanionMenu({
  onOpenAyna,
  onBuildRoadmap,
  onUploadAchievement,
  onHide,
}: CompanionMenuProps) {
  return (
    <div className="companion-menu" role="menu">
      <button type="button" onClick={onOpenAyna} className="companion-menu-button">
        ✨ Open Ayna
      </button>
      <button type="button" onClick={onBuildRoadmap} className="companion-menu-button">
        🛠 Build roadmap
      </button>
      <button type="button" onClick={onUploadAchievement} className="companion-menu-button">
        📤 Upload achievement
      </button>
      <button
        type="button"
        onClick={onHide}
        className="companion-menu-button companion-menu-button--ghost"
      >
        👁 Hide
      </button>
    </div>
  );
}
