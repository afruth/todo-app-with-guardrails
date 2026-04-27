import { useCallback, useEffect, useState } from 'react';
import { Alert, List, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { api, type ProjectView, type TodoView } from '../api';
import { useOrg } from '../org/OrgContext';
import { QuickAddTodo, type QuickAddInput } from '../components/QuickAddTodo';
import { TodoItem } from '../components/TodoItem';

export const ProjectPage = (): React.ReactElement => {
  const { projectId = '' } = useParams<{ projectId: string }>();
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
        api.listTodos(activeOrgId, projectId),
      ]);
      setProjects(p);
      setTodos(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load');
    }
  }, [activeOrgId, projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const project = projects.find((p) => p.id === projectId);

  const handleAdd = async (input: QuickAddInput): Promise<void> => {
    if (activeOrgId === null) {
      return;
    }
    await api.createTodo(activeOrgId, input);
    await refresh();
  };
  const handleToggle = async (t: TodoView): Promise<void> => {
    await api.updateTodo(t.id, { isCompleted: !t.isCompleted });
    await refresh();
  };
  const handleDelete = async (t: TodoView): Promise<void> => {
    await api.deleteTodo(t.id);
    await refresh();
  };
  const handleMove = async (t: TodoView, pid: string): Promise<void> => {
    await api.moveTodo(t.id, pid);
    await refresh();
  };
  const handleSave = async (
    t: TodoView,
    input: { title: string; deadlineAt: string | null; tagNames: string[] },
  ): Promise<void> => {
    await api.updateTodo(t.id, input);
    await refresh();
  };

  return (
    <Stack>
      <Typography variant="h4" sx={{ mb: 2 }}>
        {project?.name ?? 'Project'}
      </Typography>
      <QuickAddTodo
        projects={projects}
        defaultProjectId={projectId}
        onAdd={handleAdd}
      />
      {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List disablePadding>
        {todos.length === 0 && (
          <Typography color="text.secondary">No todos in this project yet.</Typography>
        )}
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            projects={projects}
            onToggle={() => void handleToggle(todo)}
            onDelete={() => void handleDelete(todo)}
            onMove={(pid) => void handleMove(todo, pid)}
            onSave={(input) => handleSave(todo, input)}
          />
        ))}
      </List>
    </Stack>
  );
};
