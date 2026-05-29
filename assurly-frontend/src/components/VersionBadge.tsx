import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LatestUpdatesModal } from "@/components/LatestUpdatesModal";
import { APP_VERSION } from "@/version-history";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  className?: string;
}

export function VersionBadge({ className }: VersionBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md", className)}
        aria-label={`${APP_VERSION.label} version ${APP_VERSION.version}. Open release notes.`}
      >
        <Badge
          variant="outline"
          className="cursor-pointer border-blue-200 bg-blue-50/80 px-2 py-0.5 text-[11px] font-semibold text-blue-800 hover:bg-blue-100/90 transition-colors"
        >
          {APP_VERSION.label} {APP_VERSION.version}
        </Badge>
      </button>
      <LatestUpdatesModal open={open} onOpenChange={setOpen} />
    </>
  );
}
