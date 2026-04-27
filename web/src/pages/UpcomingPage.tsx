import { useCallback, useEffect, useState } from 'react';
import { Alert, List, Stack, Typography } from '@mui/material';
import { api, type ProjectView, type TodoView } from '../api';
import { useOrg } from '../org/OrgContext';
import { TodoItem } from '../components/TodoItem';

export const UpcomingPage = (): React.ReactElement => {
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
        api.listUpcoming(activeOrgId),
      ]);
      setProjects(p);
      setTodos(t);
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
        Upcoming deadlines
      </Typography>
      {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List disablePadding>
        {todos.length === 0 && (
          <Typography color="text.secondary">No upcoming deadlines.</Typography>
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
