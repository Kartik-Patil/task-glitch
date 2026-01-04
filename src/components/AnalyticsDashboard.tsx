import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { DerivedTask, Task } from '@/types';
import {
  computeFunnel,
  computeThroughputByWeek,
} from '@/utils/logic';

interface Props {
  tasks: DerivedTask[];
}

export default function AnalyticsDashboard({ tasks }: Props) {
  const baseTasks = tasks as unknown as Task[];
  const funnel = computeFunnel(baseTasks);
  const weekly = computeThroughputByWeek(baseTasks);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>Analytics</Typography>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary">Funnel</Typography>
            <BarChart
              height={240}
              xAxis={[{ scaleType: 'band', data: ['Todo', 'In Progress', 'Done'] }]}
              series={[{ data: [funnel.todo, funnel.inProgress, funnel.done], color: '#4F6BED' }]}
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Throughput (weekly completed)</Typography>
            <LineChart
              height={240}
              xAxis={[{ scaleType: 'band', data: weekly.map(w => w.week) }]}
              series={[{ data: weekly.map(w => w.count), color: '#22A699' }]}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}


