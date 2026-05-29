import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LatestUpdatesPanel } from "@/components/LatestUpdatesPanel";
import { APP_VERSION, ASSURLY_GREEN } from "@/version-history";
import { cn } from "@/lib/utils";

interface VersionBadgeProps {
  className?: string;
}

export function VersionBadge({ className }: VersionBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md",
            className
          )}
          aria-label={`${APP_VERSION.label} version ${APP_VERSION.version}. Open release notes.`}
          aria-expanded={open}
        >
          <Badge
            variant="outline"
            className="cursor-pointer border-[#17ad99]/40 bg-[#17ad99]/10 px-2 py-0.5 text-[11px] font-semibold hover:bg-[#17ad99]/15 transition-colors"
            style={{ color: ASSURLY_GREEN }}
          >
            {APP_VERSION.label} {APP_VERSION.version}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="w-[min(100vw-2rem,26rem)] p-0 shadow-lg border-slate-200"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <LatestUpdatesPanel showHistoryLink onNavigateAway={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
