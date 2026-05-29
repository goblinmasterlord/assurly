import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  APP_VERSION,
  CHANGELOG,
  FEEDBACK_EMAIL,
  formatBuildDate,
} from "@/version-history";
import { Info, Mail, MessageSquare } from "lucide-react";

interface LatestUpdatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LatestUpdatesModal({ open, onOpenChange }: LatestUpdatesModalProps) {
  const versionTag = `v${APP_VERSION.version}`;
  const buildLabel = formatBuildDate(APP_VERSION.buildDate);
  const feedbackMailto = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(
    `Assurly feedback (${APP_VERSION.label} ${APP_VERSION.version})`
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogTitle className="sr-only">Latest Updates</DialogTitle>

        {/* Header with subtle gradient */}
        <div className="relative border-b bg-gradient-to-br from-sky-50 via-blue-50/80 to-white px-6 pb-5 pt-6 pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Latest Updates
            </h2>
            <Badge
              variant="secondary"
              className="border-blue-200/80 bg-blue-100/90 text-blue-800 hover:bg-blue-100/90 font-medium"
            >
              {versionTag}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Build {buildLabel}</p>
        </div>

        <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-6 py-5 space-y-6">
          {/* What's New */}
          <section>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Info className="h-4 w-4 text-blue-600" aria-hidden />
              What&apos;s New
            </div>
            <div className="space-y-4">
              {CHANGELOG.map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-lg border border-slate-200/80 bg-slate-50/60 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-900">{entry.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {entry.description}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {entry.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2 text-sm leading-relaxed text-slate-600"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                          aria-hidden
                        />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Feedback */}
          <section className="border-t border-slate-100 pt-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquare className="h-4 w-4 text-blue-600" aria-hidden />
              Feedback
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Your feedback helps us build a better product. Let us know what you think!
            </p>
            <Button className="mt-4 w-full gap-2" asChild>
              <a href={feedbackMailto}>
                <Mail className="h-4 w-4" />
                Send Feedback
              </a>
            </Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
