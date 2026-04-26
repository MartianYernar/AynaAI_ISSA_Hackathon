import type { StudentProfile, WorkspaceModule } from "../types";

function splitInterests(profile: StudentProfile) {
  const interests = profile.interests
    .split(/[,;\n]/)
    .map((interest) => interest.trim())
    .filter(Boolean);

  return interests.length > 0
    ? interests.slice(0, 3)
    : ["Human-centered technology", "Project building", "Research"];
}

export function getMockWorkspaceModules(
  profile: StudentProfile,
): WorkspaceModule[] {
  const interests = splitInterests(profile);
  const studentName = profile.name || "Student";
  const region = profile.region || "Local region";

  return [
    {
      id: "profile-summary",
      type: "profile-summary",
      title: "Profile signal",
      subtitle: "Starting context",
      student: {
        name: studentName,
        gradeOrAge: profile.gradeOrAge || "Grade not set",
        region,
        englishLevel: profile.englishLevel,
      },
      focus: [
        interests[0],
        profile.challenge || "Choosing a realistic next step",
        profile.hasAchievements,
      ],
      nextPrompt: "Ask Lyra to show a roadmap, career matches, or evidence ideas.",
    },
    {
      id: "interest-bars",
      type: "interest-bars",
      title: "Interest strength scan",
      subtitle: "Early pattern read",
      interests: interests.map((interest, index) => ({
        label: interest,
        score: Math.max(58, 88 - index * 12),
        evidence:
          index === 0
            ? "Mentioned as a primary pull during onboarding"
            : "Useful supporting theme for future projects",
      })),
    },
    {
      id: "career-match-table",
      type: "career-match-table",
      title: "Career match table",
      subtitle: "Fit, reason, and gap",
      matches: [
        {
          role: "Product-minded frontend engineer",
          fit: 87,
          why: "Combines visible building, user empathy, and structured learning.",
          gap: "Package projects into stronger case studies.",
        },
        {
          role: "UX researcher",
          fit: 78,
          why: "Matches reflection, interviews, and problem discovery.",
          gap: "Practice evidence synthesis and research writing.",
        },
        {
          role: "Educational technology designer",
          fit: 74,
          why: "Connects student needs with tools and learning workflows.",
          gap: "Build one small learning prototype with feedback.",
        },
      ],
    },
    {
      id: "roadmap-timeline",
      type: "roadmap-timeline",
      title: "First 90-day roadmap",
      subtitle: "Progressive next steps",
      milestones: [
        {
          phase: "Weeks 1-2",
          title: "Turn interests into one project theme",
          actions: [
            `Choose a project around ${interests[0]}`,
            "Write the problem, user, and success signal",
          ],
          outcome: "A clear project brief Lyra can refine.",
        },
        {
          phase: "Weeks 3-6",
          title: "Build visible proof",
          actions: [
            "Create a small prototype or portfolio artifact",
            "Collect screenshots, notes, and feedback",
          ],
          outcome: "One evidence-backed achievement entry.",
        },
        {
          phase: "Weeks 7-12",
          title: "Match proof to paths",
          actions: [
            "Compare 3 career or education directions",
            "Pick one next application, contest, or course",
          ],
          outcome: "A realistic next opportunity shortlist.",
        },
      ],
    },
    {
      id: "achievement-evidence",
      type: "achievement-evidence",
      title: "Achievement evidence",
      subtitle: "Portfolio-ready signals",
      evidence: [
        {
          source: "Hackathon or school project",
          strength: "Shipping under constraints",
          portfolioUse: "Case study with problem, role, result, and screenshots",
          confidence: profile.hasAchievements.startsWith("Yes") ? "high" : "medium",
        },
        {
          source: "Course certificate",
          strength: "Learning consistency",
          portfolioUse: "Support item under skills and preparation",
          confidence: "medium",
        },
        {
          source: "Volunteer or team role",
          strength: "Collaboration and ownership",
          portfolioUse: "Short proof paragraph with one concrete result",
          confidence: "low",
        },
      ],
    },
    {
      id: "opportunities-map",
      type: "opportunities-map",
      title: "Opportunity map",
      subtitle: "Mock regional scan",
      regions: [
        {
          name: region,
          opportunityCount: 8,
          category: "Local",
          note: "Start with nearby clubs, school contests, and mentorship options.",
        },
        {
          name: "Online",
          opportunityCount: 14,
          category: "Remote",
          note: "Good fit for portfolio challenges and English practice.",
        },
        {
          name: "National",
          opportunityCount: 5,
          category: "Selective",
          note: "Better after one polished evidence artifact is ready.",
        },
      ],
    },
  ];
}
