const STORAGE_KEY = 'assurly_dashboard_prefs';

export type DashboardPrefs = {
  dashboardView?: 'school' | 'trust';
  selectedTerm?: string;
};

export function loadDashboardPrefs(): DashboardPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DashboardPrefs;
  } catch {
    return {};
  }
}

export function saveDashboardPrefs(partial: DashboardPrefs): void {
  try {
    const current = loadDashboardPrefs();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...current, ...partial })
    );
  } catch (error) {
    console.error('Failed to save dashboard preferences', error);
  }
}
