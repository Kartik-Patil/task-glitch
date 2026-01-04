// FILE: src/utils/logic.ts

import type { Task, DerivedTask } from '@/types';

/* -------------------- METRICS -------------------- */

export function computeTotalRevenue(tasks: ReadonlyArray<Task>): number {
  return tasks.reduce((sum, t) => sum + t.revenue, 0);
}

export function computeTimeEfficiency(tasks: ReadonlyArray<Task>): number {
  const totalTime = tasks.reduce((s, t) => s + t.timeTaken, 0);
  if (!totalTime) return 0;
  return Math.round((tasks.length / totalTime) * 100);
}

export function computeRevenuePerHour(tasks: ReadonlyArray<Task>): number {
  const hours = tasks.reduce((s, t) => s + t.timeTaken, 0) / 60;
  if (!hours) return 0;
  return Math.round(computeTotalRevenue(tasks) / hours);
}

export function computeAverageROI(tasks: ReadonlyArray<Task>): number {
  const validROIs = tasks
    .map(t => (t.timeTaken > 0 ? t.revenue / t.timeTaken : null))
    .filter((v): v is number => Number.isFinite(v));

  if (!validROIs.length) return 0;

  const avg = validROIs.reduce((s, v) => s + v, 0) / validROIs.length;
  return Number(avg.toFixed(2));
}

export function computePerformanceGrade(
  avgROI: number,
): 'Excellent' | 'Good' | 'Needs Improvement' {
  if (avgROI >= 100) return 'Excellent';
  if (avgROI >= 60) return 'Good';
  return 'Needs Improvement';
}

/* -------------------- DERIVED -------------------- */

export function withDerived(task: Task): DerivedTask {
  const roi =
    Number.isFinite(task.revenue) && task.timeTaken > 0
      ? Number((task.revenue / task.timeTaken).toFixed(2))
      : null;

  const priorityWeight =
    task.priority === 'High'
      ? 3
      : task.priority === 'Medium'
      ? 2
      : 1;

  return {
    ...task,
    roi,
    priorityWeight,
  };
}

/* -------------------- SORT (BUG 3 SAFE) -------------------- */

export function sortTasks(
  tasks: ReadonlyArray<DerivedTask>,
): DerivedTask[] {
  return [...tasks].sort((a, b) => {
    const aROI = a.roi ?? -Infinity;
    const bROI = b.roi ?? -Infinity;

    if (bROI !== aROI) return bROI - aROI;
    if (b.priorityWeight !== a.priorityWeight) {
      return b.priorityWeight - a.priorityWeight;
    }

    if (a.createdAt !== b.createdAt) {
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    }

    return a.id.localeCompare(b.id);
  });
}

// Groups completed tasks by ISO week (Mon–Sun) and returns chart-friendly data
export function computeThroughputByWeek(tasks: Task[]) {
  const counts = new Map<string, number>();

  const toIsoWeekLabel = (d: Date) => {
    // start of ISO week (Monday)
    const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = copy.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    copy.setUTCDate(copy.getUTCDate() + diff);

    const year = copy.getUTCFullYear();
    const dayOfYear = Math.floor(
      (copy.getTime() - Date.UTC(year, 0, 1)) / 86_400_000
    ) + 1;
    const week = Math.ceil(dayOfYear / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  };

  tasks.forEach((t) => {
    if (!t || t.status?.toLowerCase?.() !== 'done') return;
    const completed = t.completedAt;
    if (!completed) return;
    const d = new Date(completed);
    if (Number.isNaN(d.getTime())) return;

    const label = toIsoWeekLabel(d);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

export function computeFunnel(tasks: Task[]) {
  const funnel = { todo: 0, inProgress: 0, done: 0 };

  tasks.forEach((t) => {
    const status = (t.status || '').toLowerCase();
    if (status === 'todo') funnel.todo += 1;
    else if (status === 'in progress' || status === 'in_progress' || status === 'inprogress')
      funnel.inProgress += 1;
    else if (status === 'done') funnel.done += 1;
  });

  return funnel;
}

// Safe day-difference helper used by TaskDetailsDialog
export function daysBetween(a: Date | string | number | null | undefined, b: Date | string | number | null | undefined): number {
  const d1 = a != null ? new Date(a) : null;
  const d2 = b != null ? new Date(b) : null;
  if (!d1 || !d2 || Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffMs / 86_400_000);
}
