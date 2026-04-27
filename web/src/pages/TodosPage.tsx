import { useCallback, useEffect, useState } from 'react';
import { Alert, List, Stack, Typography } from '@mui/material';
import { api, type ProjectView, type TodoView } from '../api';
import { useOrg } from '../org/OrgContext';
import { QuickAddTodo, type QuickAddInput } from '../components/QuickAddTodo';
import { TodoItem } from '../components/TodoItem';

export const TodosPage = (): React.ReactElement => {
  const { activeOrgId } = useOrg();
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [todos, setTodos] = useState<TodoView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (activeOrgId === null) {
      setProjects([]);
      setTodos([]);
      return;
    }
    try {
      const [p, t] = await Promise.all([
        api.listProjects(activeOrgId),
        api.listTodos(activeOrgId),
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

  if (activeOrgId === null) {
    return <Typography>Pick or create an organization to get started.</Typography>;
  }

  const handleAdd = async (input: QuickAddInput): Promise<void> => {
    await api.createTodo(activeOrgId, input);
    await refresh();
  };
  const handleToggle = async (todo: TodoView): Promise<void> => {
    await api.updateTodo(todo.id, { isCompleted: !todo.isCompleted });
    await refresh();
  };
  const handleDelete = async (todo: TodoView): Promise<void> => {
    await api.deleteTodo(todo.id);
    await refresh();
  };
  const handleMove = async (todo: TodoView, projectId: string): Promise<void> => {
    await api.moveTodo(todo.id, projectId);
    await refresh();
  };
  const handleSave = async (
    todo: TodoView,
    input: { title: string; deadlineAt: string | null; tagNames: string[] },
  ): Promise<void> => {
    await api.updateTodo(todo.id, input);
    await refresh();
  };

  const defaultProjectId =
    projects.find((p) => p.name === 'Inbox')?.id ?? projects[0]?.id ?? null;

  return (
    <Stack>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Your todos
      </Typography>
      <QuickAddTodo
        projects={projects}
        defaultProjectId={defaultProjectId}
        onAdd={handleAdd}
      />
      {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List disablePadding>
        {todos.length === 0 && (
          <Typography color="text.secondary">Nothing here yet — add your first todo above.</Typography>
        )}
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            projects={projects}
            onToggle={() => void handleToggle(todo)}
            onDelete={() => void handleDelete(todo)}
            onMove={(projectId) => void handleMove(todo, projectId)}
            onSave={(input) => handleSave(todo, input)}
          />
        ))}
      </List>
    </Stack>
  );
};
