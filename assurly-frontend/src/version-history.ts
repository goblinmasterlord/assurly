/**
 * Application version and release notes.
 * Update VERSION_HISTORY[0] with each new Early Adopter release (newest first).
 */

/** Assurly brand green from logo (#17ad99) */
export const ASSURLY_GREEN = "#17ad99";

export type ChangelogEntry = {
  title: string;
  description: string;
  bullets: string[];
};

export type VersionRelease = {
  version: string;
  buildDate: string; // YYYY-MM-DD
  entries: ChangelogEntry[];
};

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: "1.33",
    buildDate: "2026-05-29",
    entries: [
      {
        title: "Polarity-aware rating labels",
        description:
          "Assessment rating pickers now use a 1–4 scale with labels and subheadings that change for assurance vs risk standards.",
        bullets: [
          "Removed the legacy 5-option (Exceptional) rating scale from assessment pages",
          "Assurance and risk standards show distinct labels and picker subheadings",
          "Client-side score averages invert risk ratings before averaging mixed aspects",
        ],
      },
    ],
  },
  {
    version: "1.32",
    buildDate: "2026-05-29",
    entries: [
      {
        title: "Assessment actions checklist",
        description:
          "Per-standard action items are now persisted via the API instead of local mock state.",
        bullets: [
          "Checklist loads, adds, toggles, and deletes via /api/assessments/{id}/actions",
          "Dashboard shows outstanding action count per school when incomplete items exist",
          "Risk-standard rating badges use inverted RAG colours on the assessment detail table",
        ],
      },
    ],
  },
  {
    version: "1.31",
    buildDate: "2026-05-29",
    entries: [
      {
        title: "Early Adopter release notes",
        description:
          "Version badge in the header opens release notes and a full version history — only visible when you are logged in.",
        bullets: [
          "EA badge shows the current Early Adopter version",
          "Role switcher labels shortened to Overview and Assessments",
          "Full version history page lists every EA release",
        ],
      },
    ],
  },
  {
    version: "1.30",
    buildDate: "2026-05-28",
    entries: [
      {
        title: "Dashboard & assessments polish",
        description: "Small UX improvements for empty schools and the Department Head view.",
        bullets: [
          "Removed redundant subheadings on empty dashboard school rows",
          "Department Head view shows how many schools have no ratings yet for the term",
        ],
      },
    ],
  },
  {
    version: "1.29",
    buildDate: "2026-05-28",
    entries: [
      {
        title: "Central Team dashboard view",
        description:
          "The Schools / Central Team toggle now loads the correct data from the server instead of filtering client-side.",
        bullets: [
          "Central Team fetches GET /api/dashboard/schools?view=trust",
          "Schools view uses view=school (default)",
          "Switching terms no longer blanks the school list",
        ],
      },
    ],
  },
  {
    version: "1.28",
    buildDate: "2026-05-28",
    entries: [
      {
        title: "Central Team selector restored",
        description:
          "The trust central office row is included from /api/schools and the Overview toggle works again.",
        bullets: [
          "Central office detected via is_central_office (boolean)",
          "Removed legacy include_central query parameter",
        ],
      },
    ],
  },
  {
    version: "1.27",
    buildDate: "2026-05-28",
    entries: [
      {
        title: "Empty schools on the dashboard",
        description:
          "Schools with no assessments for the current term remain visible but de-emphasised.",
        bullets: [
          "Rows with total_standards 0 and status not_started render at reduced opacity",
          "All schools from the dashboard API are shown, including those with no data yet",
        ],
      },
    ],
  },
  {
    version: "1.26",
    buildDate: "2026-05-21",
    entries: [
      {
        title: "Strategic aspect category",
        description:
          "The aspect_category value formerly labelled Ofsted is now Strategic across the UI.",
        bullets: [
          "Types, filters, badges, and aspect forms use strategic",
          "Display label shows as Strategic",
        ],
      },
    ],
  },
  {
    version: "1.25",
    buildDate: "2026-05-21",
    entries: [
      {
        title: "Assessments API school metadata",
        description:
          "Assessment list responses include school_type and is_central_office for trust/school views.",
        bullets: [
          "Supports correct rendering of central office vs school assessments",
        ],
      },
    ],
  },
  {
    version: "1.24",
    buildDate: "2026-05-20",
    entries: [
      {
        title: "Dashboard schools endpoint",
        description: "MAT overview uses the bulk dashboard schools summary per term.",
        bullets: [
          "Completion rates and scores sourced from GET /api/dashboard/schools",
          "Term selector drives dashboard refresh",
        ],
      },
    ],
  },
  {
    version: "1.23",
    buildDate: "2026-04-20",
    entries: [
      {
        title: "Users management",
        description: "MAT administrators can deactivate users and optionally show inactive accounts.",
        bullets: [
          "Soft delete (is_active) instead of hard delete",
          "Show inactive users toggle",
          "Clearer deactivate confirmation dialog",
        ],
      },
    ],
  },
  {
    version: "1.22",
    buildDate: "2026-04-15",
    entries: [
      {
        title: "Ratings & school management fixes",
        description: "Stability fixes for assessment editing and the school management view.",
        bullets: [
          "Aspect names display correctly in assessment flows",
          "School management view corrections",
        ],
      },
    ],
  },
];

export const LATEST_RELEASE = VERSION_HISTORY[0];

export const APP_VERSION = {
  label: "EA",
  version: LATEST_RELEASE.version,
  buildDate: LATEST_RELEASE.buildDate,
} as const;

export const FEEDBACK_EMAIL = "tom@thetransformative.com";

export function formatBuildDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
