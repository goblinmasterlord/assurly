/**
 * Application version and release notes.
 * Update this file with each fix and new feature shipped to Early Adopters.
 */

export const APP_VERSION = {
  /** Early Adopter programme label shown in the header badge */
  label: "EA",
  version: "1.31",
  /** ISO date string (YYYY-MM-DD) — displayed as "Build {formatted}" in the updates modal */
  buildDate: "2026-05-29",
} as const;

export type ChangelogEntry = {
  title: string;
  description: string;
  bullets: string[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    title: "Schools dashboard — empty schools & Central Team view",
    description:
      "The MAT overview now surfaces every school for the selected term, including those with no assessments yet, and switches correctly between individual schools and the trust central office.",
    bullets: [
      "Schools with no assessments for the current term appear at reduced opacity so active schools stand out while empties remain visible",
      "Schools / Central Team toggle re-fetches dashboard data using view=school or view=trust (no longer a client-side filter)",
      "Switching terms no longer blanks the school list — all rows returned by the API are rendered",
      "Removed redundant subheadings (school id and “No assessments yet”) on empty dashboard rows",
    ],
  },
  {
    title: "Aspect category renamed to Strategic",
    description:
      "The aspect_category enum value formerly labelled Ofsted is now Strategic, aligned with the API and database.",
    bullets: [
      "Types, filters, badges, and aspect forms use strategic instead of ofsted",
      "Category label displays as Strategic in the UI",
    ],
  },
  {
    title: "Schools API & central office detection",
    description:
      "The frontend now matches the updated /api/schools contract for central office rows and boolean flags.",
    bullets: [
      "Removed legacy include_central query parameter — all schools are returned by default",
      "Central office identified via is_central_office (boolean) from the API",
    ],
  },
  {
    title: "Department Head assessments view",
    description:
      "School Dept. Head (Assessments) view calls out schools that still need ratings for the selected term.",
    bullets: [
      "Shows a notice when one or more schools have no ratings yet for the current term",
      "Role switcher labels shortened to Overview and Assessments to free header space",
    ],
  },
];

export const FEEDBACK_EMAIL = "tom@thetransformative.com";

export function formatBuildDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
