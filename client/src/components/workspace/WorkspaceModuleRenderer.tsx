import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import {
  Briefcase,
  CheckCircle2,
  Compass,
  FileCheck2,
  MapPinned,
  Route,
} from "lucide-react";
import type {
  AchievementEvidenceModule,
  CareerMatchTableModule,
  InterestBarsModule,
  OpportunitiesMapModule,
  ProfileSummaryModule,
  RoadmapTimelineModule,
  WorkspaceModule,
} from "../../types";

interface WorkspaceModuleRendererProps {
  module: WorkspaceModule;
}

function ModuleShell({
  children,
  className,
  delay,
  subtitle,
  title,
}: {
  children: ReactNode;
  className: string;
  delay: number;
  subtitle?: string;
  title: string;
}) {
  return (
    <motion.article
      animate={{ opacity: 1, y: 0 }}
      className={`workspace-module ${className}`}
      initial={{ opacity: 0, y: 14 }}
      transition={{ delay, duration: 0.3, ease: "easeOut" }}
    >
      <header className="module-header">
        <span>{subtitle}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </motion.article>
  );
}

export function ProfileSummaryModuleView({
  module,
}: {
  module: ProfileSummaryModule;
}) {
  return (
    <ModuleShell
      className="profile-summary-module"
      delay={0}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="profile-summary-grid">
        <div>
          <strong>{module.student.name}</strong>
          <small>{module.student.gradeOrAge}</small>
        </div>
        <div>
          <span>Region</span>
          <b>{module.student.region}</b>
        </div>
        <div>
          <span>English</span>
          <b>{module.student.englishLevel}</b>
        </div>
      </div>
      <ul className="profile-focus-list">
        {module.focus.map((item) => (
          <li key={item}>
            <CheckCircle2 size={16} strokeWidth={1.9} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p>{module.nextPrompt}</p>
    </ModuleShell>
  );
}

export function InterestBarsModuleView({
  module,
}: {
  module: InterestBarsModule;
}) {
  return (
    <ModuleShell
      className="interest-bars-module"
      delay={0.04}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="module-icon-label">
        <Compass size={18} strokeWidth={1.9} />
        <span>Signal strength</span>
      </div>
      <div className="module-bars">
        {module.interests.map((interest) => (
          <section key={interest.label}>
            <div>
              <strong>{interest.label}</strong>
              <span>{interest.score}%</span>
            </div>
            <i>
              <b style={{ width: `${interest.score}%` }} />
            </i>
            <p>{interest.evidence}</p>
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}

export function CareerMatchTableModuleView({
  module,
}: {
  module: CareerMatchTableModule;
}) {
  return (
    <ModuleShell
      className="career-match-module"
      delay={0.08}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="career-table" role="table" aria-label="Career matches">
        <div className="career-table-row is-heading" role="row">
          <span>Role</span>
          <span>Fit</span>
          <span>Gap</span>
        </div>
        {module.matches.map((match) => (
          <div className="career-table-row" key={match.role} role="row">
            <strong>{match.role}</strong>
            <span>{match.fit}%</span>
            <p>{match.gap}</p>
            <small>{match.why}</small>
          </div>
        ))}
      </div>
    </ModuleShell>
  );
}

export function RoadmapTimelineModuleView({
  module,
}: {
  module: RoadmapTimelineModule;
}) {
  return (
    <ModuleShell
      className="roadmap-timeline-module"
      delay={0.12}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="timeline-list">
        {module.milestones.map((milestone) => (
          <section key={milestone.phase}>
            <div className="timeline-marker">
              <Route size={15} strokeWidth={2} />
            </div>
            <div>
              <span>{milestone.phase}</span>
              <h3>{milestone.title}</h3>
              <ul>
                {milestone.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
              <strong>{milestone.outcome}</strong>
            </div>
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}

export function AchievementEvidenceModuleView({
  module,
}: {
  module: AchievementEvidenceModule;
}) {
  return (
    <ModuleShell
      className="achievement-evidence-module"
      delay={0.16}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="evidence-stack">
        {module.evidence.map((item) => (
          <section className={`evidence-item is-${item.confidence}`} key={item.source}>
            <FileCheck2 size={18} strokeWidth={1.9} />
            <div>
              <span>{item.source}</span>
              <strong>{item.strength}</strong>
              <p>{item.portfolioUse}</p>
            </div>
            <b>{item.confidence}</b>
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}

export function OpportunitiesMapModuleView({
  module,
}: {
  module: OpportunitiesMapModule;
}) {
  return (
    <ModuleShell
      className="opportunities-map-module"
      delay={0.2}
      subtitle={module.subtitle}
      title={module.title}
    >
      <div className="opportunity-map">
        <MapPinned size={22} strokeWidth={1.9} />
        {module.regions.map((region, index) => (
          <section
            className={`map-pin pin-${index + 1}`}
            key={region.name}
            style={{ "--pin-size": `${36 + region.opportunityCount * 2}px` } as CSSProperties}
          >
            <strong>{region.opportunityCount}</strong>
            <span>{region.name}</span>
          </section>
        ))}
      </div>
      <div className="opportunity-list">
        {module.regions.map((region) => (
          <section key={region.name}>
            <Briefcase size={16} strokeWidth={1.9} />
            <div>
              <strong>{region.category}</strong>
              <p>{region.note}</p>
            </div>
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}

export function WorkspaceModuleRenderer({
  module,
}: WorkspaceModuleRendererProps) {
  switch (module.type) {
    case "profile-summary":
      return <ProfileSummaryModuleView module={module} />;
    case "interest-bars":
      return <InterestBarsModuleView module={module} />;
    case "career-match-table":
      return <CareerMatchTableModuleView module={module} />;
    case "roadmap-timeline":
      return <RoadmapTimelineModuleView module={module} />;
    case "achievement-evidence":
      return <AchievementEvidenceModuleView module={module} />;
    case "opportunities-map":
      return <OpportunitiesMapModuleView module={module} />;
    default:
      return null;
  }
}
