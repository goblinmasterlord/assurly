import React, { useEffect, useMemo, useState } from "react";
import { Grid3x3 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { assessmentService } from "@/services/enhanced-assessment-service";
import type { Aspect, AspectCategory, School } from "@/types/assessment";
import { getRagCellClasses } from "@/utils/rag";
import { getRatingLabel } from "@/utils/rating-labels";
import { cn } from "@/lib/utils";

type AspectCategoryFilter = "all" | AspectCategory;

interface RiskStandardRow {
  matStandardId: string;
  standardCode: string;
  standardName: string;
  sortOrder: number;
}

interface MatrixSchool {
  schoolId: string;
  schoolName: string;
}

interface RiskProfileMatrixProps {
  aspects: Aspect[];
  schools: School[];
  selectedUniqueTermId: string | undefined;
  aspectCategoryFilter: AspectCategoryFilter;
}

const UNRATED_CELL_CLASS =
  "bg-slate-50 text-muted-foreground border border-slate-100";
const HEADER_TRUNCATE = 14;
const STANDARD_NAME_TRUNCATE = 28;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function schoolIdOf(school: School): string | undefined {
  return school.school_id || school.id;
}

function schoolNameOf(school: School): string {
  return school.school_name || school.name || "";
}

function readMatrixRating(
  ratings: Record<string, Record<string, number | null>>,
  matStandardId: string,
  schoolId: string
): number | null {
  const value = ratings[matStandardId]?.[schoolId];
  if (value == null || value < 1 || value > 4) return null;
  return value;
}

function averageRatings(values: (number | null | undefined)[]): number | null {
  const rated = values.filter(
    (v): v is number => v != null && v >= 1 && v <= 4
  );
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

function ragClassesForAverage(avg: number | null): string {
  if (avg == null) return UNRATED_CELL_CLASS;
  const band = Math.min(4, Math.max(1, Math.round(avg))) as 1 | 2 | 3 | 4;
  return getRagCellClasses(band, "risk");
}

/**
 * Trust-wide risk posture matrix (standard × school).
 * Intentionally ignores the Analytics Trust/School dashboard toggle — columns
 * are always all MAT schools (including central office). Do not wire `dashboardView`.
 *
 * Evidence file indicators (standard_evidence rows) are not shown: the by-aspect
 * API does not expose per-cell evidence presence; see product follow-up.
 */
export function RiskProfileMatrix({
  aspects,
  schools,
  selectedUniqueTermId,
  aspectCategoryFilter,
}: RiskProfileMatrixProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [standards, setStandards] = useState<RiskStandardRow[]>([]);
  const [matrixSchools, setMatrixSchools] = useState<MatrixSchool[]>([]);
  const [ratingsByStandard, setRatingsByStandard] = useState<
    Record<string, Record<string, number | null>>
  >({});

  const matSchools = useMemo((): MatrixSchool[] => {
    return [...schools]
      .filter((s) => schoolIdOf(s))
      .sort((a, b) => {
        const centralA = a.is_central_office ? 1 : 0;
        const centralB = b.is_central_office ? 1 : 0;
        if (centralA !== centralB) return centralA - centralB;
        return schoolNameOf(a).localeCompare(schoolNameOf(b));
      })
      .map((s) => ({
        schoolId: schoolIdOf(s)!,
        schoolName: schoolNameOf(s),
      }));
  }, [schools]);

  const filteredAspects = useMemo(() => {
    if (aspectCategoryFilter === "all") return aspects;
    return aspects.filter((a) => a.aspect_category === aspectCategoryFilter);
  }, [aspects, aspectCategoryFilter]);

  useEffect(() => {
    if (!selectedUniqueTermId || filteredAspects.length === 0) {
      setStandards([]);
      setMatrixSchools([]);
      setRatingsByStandard({});
      return;
    }

    if (matSchools.length === 0) {
      setStandards([]);
      setMatrixSchools([]);
      setRatingsByStandard({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const standardMap = new Map<string, RiskStandardRow>();
        const ratings: Record<string, Record<string, number | null>> = {};

        await Promise.all(
          filteredAspects.map(async (aspect) => {
            await Promise.all(
              matSchools.map(async ({ schoolId }) => {
                try {
                  const data = await assessmentService.getAssessmentsByAspect(
                    aspect.aspect_code,
                    schoolId,
                    selectedUniqueTermId
                  );
                  for (const std of data.standards) {
                    if (std.standard_type !== "risk") continue;

                    if (!standardMap.has(std.mat_standard_id)) {
                      standardMap.set(std.mat_standard_id, {
                        matStandardId: std.mat_standard_id,
                        standardCode: std.standard_code,
                        standardName: std.standard_name,
                        sortOrder: std.sort_order,
                      });
                    }

                    if (!ratings[std.mat_standard_id]) {
                      ratings[std.mat_standard_id] = {};
                    }
                    ratings[std.mat_standard_id][schoolId] = std.rating;
                  }
                } catch {
                  // Aspect may not exist for this school/term
                }
              })
            );
          })
        );

        if (cancelled) return;

        const rows = Array.from(standardMap.values()).sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
          return a.standardCode.localeCompare(b.standardCode);
        });

        setStandards(rows);
        setMatrixSchools(matSchools);
        setRatingsByStandard(ratings);
      } catch (err) {
        console.error("Failed to load Risk Profile matrix:", err);
        if (!cancelled) {
          setError("Unable to load risk profile data. Please try again.");
          setStandards([]);
          setRatingsByStandard({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedUniqueTermId, filteredAspects, matSchools]);

  const schoolAverages = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const { schoolId } of matrixSchools) {
      const values = standards.map((row) =>
        readMatrixRating(ratingsByStandard, row.matStandardId, schoolId)
      );
      result[schoolId] = averageRatings(values);
    }
    return result;
  }, [standards, matrixSchools, ratingsByStandard]);

  const standardAverages = useMemo(() => {
    const result: Record<string, number | null> = {};
    for (const row of standards) {
      const values = matrixSchools.map(({ schoolId }) =>
        readMatrixRating(ratingsByStandard, row.matStandardId, schoolId)
      );
      result[row.matStandardId] = averageRatings(values);
    }
    return result;
  }, [standards, matrixSchools, ratingsByStandard]);

  const trustWideAverage = useMemo(() => {
    const values: (number | null)[] = [];
    for (const row of standards) {
      for (const { schoolId } of matrixSchools) {
        values.push(
          readMatrixRating(ratingsByStandard, row.matStandardId, schoolId)
        );
      }
    }
    return averageRatings(values);
  }, [standards, matrixSchools, ratingsByStandard]);

  if (!selectedUniqueTermId) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Select a term to view the risk profile matrix.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading risk profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-8">{error}</p>
    );
  }

  if (standards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No risk standards configured for this MAT.
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th
                className={cn(
                  "sticky left-0 z-20 min-w-[160px] bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground",
                  "border-r border-slate-200"
                )}
              >
                Standard
              </th>
              {matrixSchools.map((school) => (
                <th
                  key={school.schoolId}
                  className="min-w-[72px] px-2 py-2 text-center font-medium text-muted-foreground"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">
                        {truncate(school.schoolName, HEADER_TRUNCATE)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{school.schoolName}</TooltipContent>
                  </Tooltip>
                </th>
              ))}
              <th className="min-w-[88px] px-2 py-2 text-center font-semibold text-foreground border-l border-slate-200 bg-muted/30">
                Trust avg
              </th>
            </tr>
          </thead>
          <tbody>
            {standards.map((row) => (
              <tr key={row.matStandardId} className="border-b last:border-b-0">
                <td
                  className={cn(
                    "sticky left-0 z-10 bg-background px-3 py-2 align-middle border-r border-slate-200",
                    "font-medium"
                  )}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-default leading-snug">
                        <span className="font-mono text-xs text-muted-foreground mr-1.5">
                          {row.standardCode}
                        </span>
                        <span className="text-foreground">
                          {truncate(row.standardName, STANDARD_NAME_TRUNCATE)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {row.standardCode}: {row.standardName}
                    </TooltipContent>
                  </Tooltip>
                </td>
                {matrixSchools.map((school) => {
                  const rating = readMatrixRating(
                    ratingsByStandard,
                    row.matStandardId,
                    school.schoolId
                  );
                  const rated = rating != null;
                  return (
                    <td key={school.schoolId} className="p-0.5">
                      <MatrixCell
                        rated={rated}
                        rating={rating}
                        tooltip={
                          rated
                            ? `${row.standardName} — ${school.schoolName}: ${getRatingLabel(rating, "risk")}`
                            : `${row.standardName} — ${school.schoolName}: Not rated`
                        }
                        cellClass={
                          rated
                            ? getRagCellClasses(rating, "risk")
                            : UNRATED_CELL_CLASS
                        }
                      />
                    </td>
                  );
                })}
                <td className="p-0.5 border-l border-slate-200">
                  <AggregateCell
                    value={standardAverages[row.matStandardId]}
                    tooltip={`${row.standardName} — trust average`}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-muted/20">
              <td
                className={cn(
                  "sticky left-0 z-10 bg-muted/20 px-3 py-2 font-semibold border-r border-slate-200"
                )}
              >
                School avg
              </td>
              {matrixSchools.map((school) => (
                <td key={school.schoolId} className="p-0.5">
                  <AggregateCell
                    value={schoolAverages[school.schoolId]}
                    tooltip={`${school.schoolName} — school average (risk standards)`}
                  />
                </td>
              ))}
              <td className="p-0.5 border-l border-slate-200">
                <AggregateCell
                  value={trustWideAverage}
                  tooltip="Trust-wide average across all risk standards and schools"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
        <Grid3x3 className="h-3.5 w-3.5 shrink-0" />
        Ratings for the selected term. Trust avg column and School avg row
        exclude unrated cells. Uses the aspect category filter on Ratings by
        Aspects above.
      </p>
    </TooltipProvider>
  );
}

function MatrixCell({
  rated,
  rating,
  tooltip,
  cellClass,
}: {
  rated: boolean;
  rating: number | null;
  tooltip: string;
  cellClass: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative flex h-10 min-w-[56px] items-center justify-center rounded-sm text-sm font-semibold tabular-nums",
            cellClass
          )}
        >
          {rated && rating != null ? rating : null}
        </div>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function AggregateCell({
  value,
  tooltip,
}: {
  value: number | null | undefined;
  tooltip: string;
}) {
  const hasValue = value != null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex h-10 min-w-[56px] items-center justify-center rounded-sm text-sm font-semibold tabular-nums",
            hasValue ? ragClassesForAverage(value) : UNRATED_CELL_CLASS
          )}
        >
          {hasValue ? value.toFixed(1) : "—"}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {hasValue
          ? `${tooltip}: ${value.toFixed(1)} (${getRatingLabel(Math.min(4, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4, "risk")} band)`
          : `${tooltip}: Not rated`}
      </TooltipContent>
    </Tooltip>
  );
}
