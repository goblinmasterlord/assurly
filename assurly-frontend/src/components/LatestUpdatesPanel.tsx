import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APP_VERSION,
  ASSURLY_GREEN,
  FEEDBACK_EMAIL,
  LATEST_RELEASE,
  formatBuildDate,
  type ChangelogEntry,
  type VersionRelease,
} from "@/version-history";
import { Info, Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

function ChangelogCards({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div
          key={entry.title}
          className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4"
        >
          <h3 className="text-sm font-semibold text-slate-900">{entry.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{entry.description}</p>
          <ul className="mt-3 space-y-2">
            {entry.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ASSURLY_GREEN }}
                  aria-hidden
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface UpdatesPanelHeaderProps {
  release: VersionRelease;
  compact?: boolean;
}

function UpdatesPanelHeader({ release, compact }: UpdatesPanelHeaderProps) {
  const versionTag = `v${release.version}`;
  const buildLabel = formatBuildDate(release.buildDate);

  return (
    <div
      className={cn("border-b px-4 pb-4 pt-4", compact ? "rounded-t-lg" : "rounded-t-xl")}
      style={{ backgroundColor: ASSURLY_GREEN }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-white">Latest Updates</h2>
            <Badge className="border-white/30 bg-white/20 text-white hover:bg-white/20 font-medium">
              {versionTag}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-white/85">Build {buildLabel}</p>
        </div>
        <div
          className="shrink-0 rounded-md border border-blue-200/90 bg-blue-50 px-3 py-2 text-right shadow-sm"
          aria-label="Early Adopter programme"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600/90">
            Programme
          </p>
          <p className="text-sm font-semibold leading-tight text-blue-900">Early Adopter</p>
        </div>
      </div>
    </div>
  );
}

interface LatestUpdatesPanelProps {
  /** Show link to full version history (popover only) */
  showHistoryLink?: boolean;
  onNavigateAway?: () => void;
  className?: string;
}

export function LatestUpdatesPanel({
  showHistoryLink = false,
  onNavigateAway,
  className,
}: LatestUpdatesPanelProps) {
  const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `Assurly feedback (${APP_VERSION.label} ${APP_VERSION.version})`
  )}`;

  return (
    <div className={cn("flex flex-col", className)}>
      <UpdatesPanelHeader release={LATEST_RELEASE} compact />

      <div className="max-h-[min(55vh,24rem)] overflow-y-auto px-4 py-4 space-y-5">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Info className="h-4 w-4" style={{ color: ASSURLY_GREEN }} aria-hidden />
            What&apos;s New
          </div>
          <ChangelogCards entries={LATEST_RELEASE.entries} />
        </section>

        {showHistoryLink && (
          <p className="text-center text-sm">
            <Link
              to="/app/version-history"
              className="font-medium text-blue-700 hover:text-blue-800 hover:underline"
              onClick={onNavigateAway}
            >
              View full version history
            </Link>
          </p>
        )}

        <section className="border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MessageSquare className="h-4 w-4" style={{ color: ASSURLY_GREEN }} aria-hidden />
            Feedback
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Your feedback helps us build a better product. Let us know what you think!
          </p>
          <Button className="mt-3 w-full gap-2" asChild>
            <a href={feedbackMailto}>
              <Mail className="h-4 w-4" />
              Send Feedback
            </a>
          </Button>
        </section>
      </div>
    </div>
  );
}

export { ChangelogCards };
