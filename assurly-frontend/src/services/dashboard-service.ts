import apiClient from '@/lib/api-client';
import type { SchoolsDashboardResponse } from '@/types/dashboard';

/**
 * GET /api/dashboard/schools?term_id=T2-2025-26
 *
 * Notes:
 * - Backend returns an object in normal cases: { current_term, schools: [...] }
 * - Backend may return [] if there are no assessments at all (older behavior). We normalize that.
 */
export async function getSchoolsDashboard(termId?: string): Promise<SchoolsDashboardResponse> {
  const params = new URLSearchParams();
  if (termId) params.set('term_id', termId);

  const url = `/api/dashboard/schools${params.toString() ? `?${params}` : ''}`;
  const response = await apiClient.get<any>(url);

  if (Array.isArray(response.data)) {
    return { current_term: null, schools: [] };
  }

  return response.data as SchoolsDashboardResponse;
}

