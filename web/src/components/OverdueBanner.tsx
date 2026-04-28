import { useEffect, useState } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import { TODOS_CHANGED_EVENT, api, type TodoView } from '../api';
import { useOrg } from '../org/OrgContext';

const RECHECK_INTERVAL_MS = 60_000;

const isOverdueOpen = (todo: TodoView, now: number): boolean => {
  if (todo.isCompleted) {
    return false;
  }
  if (todo.deadlineAt === null) {
    return false;
  }
  return new Date(todo.deadlineAt).getTime() < now;
};

const useOverdueCount = (orgId: string | null): number => {
  const [todos, setTodos] = useState<TodoView[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChanged = (): void => setTick((n) => n + 1);
    window.addEventListener(TODOS_CHANGED_EVENT, onChanged);
    const interval = window.setInterval(onChanged, RECHECK_INTERVAL_MS);
    return () => {
      window.removeEventListener(TODOS_CHANGED_EVENT, onChanged);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (orgId === null) {
      setTodos([]);
      return;
    }
    let alive = true;
    api
      .listTodos(orgId)
      .then((data) => alive && setTodos(data))
      .catch(() => alive && setTodos([]));
    return () => {
      alive = false;
    };
  }, [orgId, tick]);

  const now = Date.now();
  return todos.filter((t) => isOverdueOpen(t, now)).length;
};

export const OverdueBanner = (): React.ReactElement | null => {
  const { activeOrgId } = useOrg();
  const count = useOverdueCount(activeOrgId);
  if (count === 0) {
    return null;
  }
  const label = count === 1 ? '1 overdue todo' : `${String(count)} overdue todos`;
  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      <AlertTitle>Heads up — {label}</AlertTitle>
      You have open todos past their deadline. Review them in{' '}
      <strong>Upcoming</strong> or your project lists.
    </Alert>
  );
};
