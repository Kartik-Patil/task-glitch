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
