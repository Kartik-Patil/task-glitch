import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import MetricsBar from '@/components/MetricsBar';
import TaskTable, { TaskFormPayload } from '@/components/TaskTable';
import UndoSnackbar from '@/components/UndoSnackbar';
import { useCallback, useMemo, useState } from 'react';
import { UserProvider, useUser } from '@/context/UserContext';
import { TasksProvider, useTasksContext } from '@/context/TasksContext';
import ChartsDashboard from '@/components/ChartsDashboard';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import ActivityLog, { ActivityItem } from '@/components/ActivityLog';
import { downloadCSV, toCSV } from '@/utils/csv';
import type { Task } from '@/types';
import {
  computeAverageROI,
  computePerformanceGrade,
  computeRevenuePerHour,
  computeTimeEfficiency,
  computeTotalRevenue,
} from '@/utils/logic';

function AppContent() {
  const {
    loading,
    error,
    derivedSorted,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
    lastDeleted,
  } = useTasksContext();

  const handleCloseUndo = () => {};
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState<string>('All');
  const [fPriority, setFPriority] = useState<string>('All');
  const { user } = useUser();
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  const createActivity = useCallback(
    (type: ActivityItem['type'], summary: string): ActivityItem => ({
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts: Date.now(),
      type,
      summary,
    }),
    [],
  );

  const filtered = useMemo(() => {
    return derivedSorted.filter(t => {
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (fStatus !== 'All' && t.status !== fStatus) return false;
      if (fPriority !== 'All' && t.priority !== fPriority) return false;
      return true;
    });
  }, [derivedSorted, q, fStatus, fPriority]);

  // ✅ FIXED TYPE
  const handleAdd = useCallback(
    (payload: TaskFormPayload) => {
      addTask(payload);
      setActivity(prev =>
        [createActivity('add', `Added: ${payload.title}`), ...prev].slice(0, 50),
      );
    },
    [addTask, createActivity],
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Task>) => {
      updateTask(id, patch);
      setActivity(prev =>
        [
          createActivity(
            'update',
            `Updated: ${Object.keys(patch).join(', ')}`,
          ),
          ...prev,
        ].slice(0, 50),
      );
    },
    [updateTask, createActivity],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id);
      setActivity(prev =>
        [createActivity('delete', `Deleted task ${id}`), ...prev].slice(0, 50),
      );
    },
    [deleteTask, createActivity],
  );

  const handleUndo = useCallback(() => {
    undoDelete();
    setActivity(prev =>
      [createActivity('undo', 'Undo delete'), ...prev].slice(0, 50),
    );
  }, [undoDelete, createActivity]);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between">
            <Box>
              <Typography variant="h3" fontWeight={700}>
                TaskGlitch
              </Typography>
              <Typography color="text.secondary">
                Welcome back, {user.name.split(' ')[0]}.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                onClick={() => {
                  const csv = toCSV(filtered);
                  downloadCSV('tasks.csv', csv);
                }}
              >
                Export CSV
              </Button>
              <Avatar>{user.name.charAt(0)}</Avatar>
            </Stack>
          </Stack>

          {loading && (
            <Stack alignItems="center" py={6}>
              <CircularProgress />
            </Stack>
          )}

          {error && <Alert severity="error">{error}</Alert>}

          {!loading && !error && (
            <>
              <MetricsBar
                metricsOverride={{
                  totalRevenue: computeTotalRevenue(filtered),
                  totalTimeTaken: filtered.reduce(
                    (s, t) => s + t.timeTaken,
                    0,
                  ),
                  timeEfficiencyPct: computeTimeEfficiency(filtered),
                  revenuePerHour: computeRevenuePerHour(filtered),
                  averageROI: computeAverageROI(filtered),
                  performanceGrade: computePerformanceGrade(
                    computeAverageROI(filtered),
                  ),
                }}
              />

              <TaskTable
                tasks={filtered}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />

              <ChartsDashboard tasks={filtered} />
              <AnalyticsDashboard tasks={filtered} />
              <ActivityLog items={activity} />
            </>
          )}

          <UndoSnackbar
            open={!!lastDeleted}
            onClose={handleCloseUndo}
            onUndo={handleUndo}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default function App() {
  return (
    <UserProvider>
      <TasksProvider>
        <AppContent />
      </TasksProvider>
    </UserProvider>
  );
}
