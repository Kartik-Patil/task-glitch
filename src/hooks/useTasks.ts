import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DerivedTask, Metrics, Task, TaskFormPayload } from '@/types';
import {
  computeAverageROI,
  computePerformanceGrade,
  computeRevenuePerHour,
  computeTimeEfficiency,
  computeTotalRevenue,
  withDerived,
  sortTasks as sortDerived,
} from '@/utils/logic';
import { generateSalesTasks } from '@/utils/seed';

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  derivedSorted: DerivedTask[];
  metrics: Metrics;
  lastDeleted: Task | null;
  addTask: (task: TaskFormPayload) => void;   // ✅ FIXED
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
}

const INITIAL_METRICS: Metrics = {
  totalRevenue: 0,
  totalTimeTaken: 0,
  timeEfficiencyPct: 0,
  revenuePerHour: 0,
  averageROI: 0,
  performanceGrade: 'Needs Improvement',
};

export function useTasks(): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);

  // -------- FETCH (Bug 1 already fixed) --------
  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const res = await fetch('/tasks.json');
        if (!res.ok) throw new Error(`Failed to load tasks.json (${res.status})`);

        const data = (await res.json()) as any[];
        const normalized = data.map((t: any, idx: number) => ({
          id: t.id ?? crypto.randomUUID(),
          title: String(t.title || '').trim() || 'Untitled Task',
          revenue: Number.isFinite(Number(t.revenue)) ? Number(t.revenue) : 0,
          timeTaken: Number(t.timeTaken) > 0 ? Number(t.timeTaken) : 1,
          priority: t.priority ?? 'Medium',
          status: t.status ?? 'Todo',
          notes: t.notes,
          createdAt: new Date(
            Date.now() - (idx + 1) * 24 * 3600 * 1000
          ).toISOString(),
          completedAt:
            t.status === 'Done'
              ? new Date().toISOString()
              : undefined,
        }));

        if (isMounted) {
          setTasks(normalized.length ? normalized : generateSalesTasks(50));
        }
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? 'Failed to load tasks');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const derivedSorted = useMemo(
    () => sortDerived(tasks.map(withDerived)),
    [tasks],
  );

  const metrics = useMemo<Metrics>(() => {
    if (!tasks.length) return INITIAL_METRICS;
    const totalRevenue = computeTotalRevenue(tasks);
    const totalTimeTaken = tasks.reduce((s, t) => s + t.timeTaken, 0);
    const timeEfficiencyPct = computeTimeEfficiency(tasks);
    const revenuePerHour = computeRevenuePerHour(tasks);
    const averageROI = computeAverageROI(tasks);
    const performanceGrade = computePerformanceGrade(averageROI);
    return {
      totalRevenue,
      totalTimeTaken,
      timeEfficiencyPct,
      revenuePerHour,
      averageROI,
      performanceGrade,
    };
  }, [tasks]);

  // ✅ FIXED
  const addTask = useCallback((task: TaskFormPayload) => {
    setTasks(prev => {
      const id = task.id ?? crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const completedAt =
        task.status === 'Done' ? createdAt : undefined;

      return [
        ...prev,
        {
          ...task,
          id,
          createdAt,
          completedAt,
        },
      ];
    });
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t =>
        t.id !== id
          ? t
          : {
              ...t,
              ...patch,
              completedAt:
                t.status !== 'Done' &&
                patch.status === 'Done'
                  ? new Date().toISOString()
                  : t.completedAt,
            },
      ),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id) ?? null;
      setLastDeleted(target);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    setTasks(prev => [...prev, lastDeleted]);
    setLastDeleted(null);
  }, [lastDeleted]);

  return {
    tasks,
    loading,
    error,
    derivedSorted,
    metrics,
    lastDeleted,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
  };
}
  // -------- FETCH (Bug 1 already fixed) --------