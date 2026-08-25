import apiClient from '@/lib/api-client';

export type ActionItem = {
  id: string;
  text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  created_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
};

export type UiAction = {
  id: string;
  text: string;
  completed: boolean;
};

export type ActionUpdate = Partial<{
  text: string;
  is_completed: boolean;
  sort_order: number;
}>;

function toUiAction(item: ActionItem): UiAction {
  return {
    id: item.id,
    text: item.text,
    completed: item.is_completed,
  };
}

export async function getActions(assessmentId: string): Promise<UiAction[]> {
  try {
    const response = await apiClient.get<ActionItem[]>(
      `/api/assessments/${encodeURIComponent(assessmentId)}/actions`
    );
    return response.data.map(toUiAction);
  } catch (error) {
    console.error(`Failed to fetch actions for assessment ${assessmentId}:`, error);
    throw new Error('Failed to load action items. Please try again.');
  }
}

export async function createAction(
  assessmentId: string,
  text: string,
  sortOrder?: number
): Promise<UiAction> {
  try {
    const body: { text: string; sort_order?: number } = { text };
    if (sortOrder !== undefined) {
      body.sort_order = sortOrder;
    }
    const response = await apiClient.post<ActionItem>(
      `/api/assessments/${encodeURIComponent(assessmentId)}/actions`,
      body
    );
    return toUiAction(response.data);
  } catch (error) {
    console.error(`Failed to create action for assessment ${assessmentId}:`, error);
    throw new Error('Failed to add action item. Please try again.');
  }
}

export async function updateAction(
  assessmentId: string,
  actionId: string,
  changes: ActionUpdate
): Promise<UiAction> {
  try {
    const response = await apiClient.put<ActionItem>(
      `/api/assessments/${encodeURIComponent(assessmentId)}/actions/${encodeURIComponent(actionId)}`,
      changes
    );
    return toUiAction(response.data);
  } catch (error) {
    console.error(`Failed to update action ${actionId}:`, error);
    throw new Error('Failed to update action item. Please try again.');
  }
}

export async function deleteAction(assessmentId: string, actionId: string): Promise<void> {
  try {
    await apiClient.delete(
      `/api/assessments/${encodeURIComponent(assessmentId)}/actions/${encodeURIComponent(actionId)}`
    );
  } catch (error) {
    console.error(`Failed to delete action ${actionId}:`, error);
    throw new Error('Failed to delete action item. Please try again.');
  }
}
