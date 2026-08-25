import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChangelogCards } from "@/components/LatestUpdatesPanel";
import {
  APP_VERSION,
  ASSURLY_GREEN,
  FEEDBACK_EMAIL,
  VERSION_HISTORY,
  formatBuildDate,
} from "@/version-history";
import { ArrowLeft, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Full release history — intended entry point is the EA version badge only (no nav link).
 */
export function VersionHistoryPage() {
  const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `Assurly feedback (${APP_VERSION.label})`
  )}`;

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
          <Link to="/app/assessments" replace>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Early Adopter ({APP_VERSION.label}) — all releases, newest first.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div
          className="border-b px-6 py-5"
          style={{ backgroundColor: ASSURLY_GREEN }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Release history</h2>
              <p className="mt-1 text-sm text-white/85">
                {VERSION_HISTORY.length} Early Adopter releases
              </p>
            </div>
            <div className="shrink-0 rounded-md border border-blue-200/90 bg-blue-50 px-3 py-2 text-right shadow-sm">
              <p className="text-[10px] font-medium uppercase tracking-wide text-blue-600/90">
                Programme
              </p>
              <p className="text-sm font-semibold leading-tight text-blue-900">Early Adopter</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {VERSION_HISTORY.map((release) => (
            <section key={release.version} className="px-6 py-6">
              <div className="mb-4 flex flex-wrap items-baseline gap-2">
                <Badge
                  variant="outline"
                  className="font-semibold"
                  style={{ borderColor: `${ASSURLY_GREEN}66`, color: ASSURLY_GREEN }}
                >
                  v{release.version}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Build {formatBuildDate(release.buildDate)}
                </span>
              </div>
              <ChangelogCards entries={release.entries} />
            </section>
          ))}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5">
          <p className="text-sm text-slate-600 mb-3">
            Questions or feedback on any release? We&apos;d love to hear from you.
          </p>
          <Button variant="outline" className="gap-2" asChild>
            <a href={feedbackMailto}>
              <Mail className="h-4 w-4" />
              Send Feedback
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
