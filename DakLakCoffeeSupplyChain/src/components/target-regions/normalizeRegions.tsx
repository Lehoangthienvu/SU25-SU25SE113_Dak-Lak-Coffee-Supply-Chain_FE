import { ProcurementPlansDetails } from "@/lib/api/procurementPlans";

export const normalizeRegions = (detail: Partial<ProcurementPlansDetails>): string[] => {
  if (Array.isArray(detail.targetRegions) && detail.targetRegions.length > 0) {
    return detail.targetRegions;
  }

  if (typeof detail.targetRegion === "string" && detail.targetRegion.trim() !== "") {
    try {
      const parsed = JSON.parse(detail.targetRegion);
      if (parsed?.targetRegions) {
        return parsed.targetRegions;
      }
    } catch {
      return [detail.targetRegion];
    }
  }

  return [];
};
