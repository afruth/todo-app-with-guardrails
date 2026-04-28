import { useCallback, useEffect, useState } from 'react';
import { Alert, List, Stack, Typography } from '@mui/material';
import { api, type ProjectView, type TodoView } from '../api';
import { useOrg } from '../org/OrgContext';
import { TodoItem } from '../components/TodoItem';

const isOverdueOpen = (todo: TodoView, now: number): boolean => {
  if (todo.isCompleted) {
    return false;
  }
  if (todo.deadlineAt === null) {
    return false;
  }
  return new Date(todo.deadlineAt).getTime() < now;
};

const sortByDeadlineAsc = (a: TodoView, b: TodoView): number => {
  const ad = a.deadlineAt === null ? 0 : new Date(a.deadlineAt).getTime();
  const bd = b.deadlineAt === null ? 0 : new Date(b.deadlineAt).getTime();
  return ad - bd;
};

export const OverduePage = (): React.ReactElement => {
  const { activeOrgId } = useOrg();
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [todos, setTodos] = useState<TodoView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (activeOrgId === null) {
      return;
    }
    try {
      const [p, t] = await Promise.all([
        api.listProjects(activeOrgId),
        api.listTodos(activeOrgId),
      ]);
      setProjects(p);
      const now = Date.now();
      setTodos(t.filter((todo) => isOverdueOpen(todo, now)).sort(sortByDeadlineAsc));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }, [activeOrgId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onToggle = async (t: TodoView): Promise<void> => {
    await api.updateTodo(t.id, { isCompleted: !t.isCompleted });
    await refresh();
  };
  const onDelete = async (t: TodoView): Promise<void> => {
    await api.deleteTodo(t.id);
    await refresh();
  };
  const onMove = async (t: TodoView, pid: string): Promise<void> => {
    await api.moveTodo(t.id, pid);
    await refresh();
  };
  const onSave = async (
    t: TodoView,
    input: { title: string; deadlineAt: string | null; tagNames: string[] },
  ): Promise<void> => {
    await api.updateTodo(t.id, input);
    await refresh();
  };

  return (
    <Stack>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Overdue
      </Typography>
      {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List disablePadding>
        {todos.length === 0 && (
          <Typography color="text.secondary">Nothing overdue — nice.</Typography>
        )}
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            projects={projects}
            onToggle={() => void onToggle(todo)}
            onDelete={() => void onDelete(todo)}
            onMove={(pid) => void onMove(todo, pid)}
            onSave={(input) => onSave(todo, input)}
          />
        ))}
      </List>
    </Stack>
  );
};
