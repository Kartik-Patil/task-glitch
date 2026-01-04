export type Priority = 'High' | 'Medium' | 'Low';
export type Status = 'Todo' | 'In Progress' | 'Done';

/**
 * Fully materialized Task
 * (system-owned fields included)
 */
export interface Task {
  id: string;
  title: string;
  revenue: number;
  timeTaken: number;
  priority: Priority;
  status: Status;
  notes?: string;
  createdAt: string;     // system generated
  completedAt?: string; // system generated if Done
}

/**
 * Payload coming FROM UI (forms, tables)
 * System fields must NOT be provided by UI
 */
export type TaskFormPayload =
  Omit<Task, 'id' | 'createdAt' | 'completedAt'> & {
    id?: string; // present only when editing
  };

export interface DerivedTask extends Task {
  roi: number | null; // null means N/A
  priorityWeight: 3 | 2 | 1;
}

export interface Metrics {
  totalRevenue: number;
  totalTimeTaken: number;
  timeEfficiencyPct: number; // 0..100
  revenuePerHour: number;   // may be NaN/Infinity -> handle in UI
  averageROI: number;       // average over valid ROI values
  performanceGrade: 'Excellent' | 'Good' | 'Needs Improvement';
}
