import { useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import type { ProjectView, TodoView } from '../api';

const formatDeadline = (iso: string | null): string => {
  if (iso === null) {
    return '';
  }
  const date = new Date(iso);
  return date.toLocaleString();
};

const isoToLocalInput = (iso: string | null): string => {
  if (iso === null) {
    return '';
  }
  const d = new Date(iso);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
};

interface ItemProps {
  todo: TodoView;
  projects: readonly ProjectView[];
  onToggle: () => void;
  onDelete: () => void;
  onMove: (projectId: string) => void;
  onSave: (input: { title: string; deadlineAt: string | null; tagNames: string[] }) => Promise<void>;
}

const projectName = (id: string, projects: readonly ProjectView[]): string =>
  projects.find((p) => p.id === id)?.name ?? '';

export const TodoItem = ({
  todo,
  projects,
  onToggle,
  onDelete,
  onMove,
  onSave,
}: ItemProps): React.ReactElement => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [deadline, setDeadline] = useState(isoToLocalInput(todo.deadlineAt));
  const [tagsRaw, setTagsRaw] = useState(todo.tags.join(', '));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const save = async (): Promise<void> => {
    await onSave({
      title: title.trim(),
      deadlineAt: deadline === '' ? null : new Date(deadline).toISOString(),
      tagNames: tagsRaw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <Paper sx={{ p: 2, mb: 1 }}>
        <Stack spacing={1}>
          <TextField fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          <Stack direction="row" spacing={1}>
            <TextField
              type="datetime-local"
              label="Deadline"
              slotProps={{ inputLabel: { shrink: true } }}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <TextField
              label="Tags"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
              fullWidth
            />
            <IconButton onClick={() => void save()} aria-label="save"><SaveIcon /></IconButton>
            <IconButton onClick={() => setEditing(false)} aria-label="cancel"><CloseIcon /></IconButton>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ mb: 1 }}>
      <ListItem
        secondaryAction={
          <Box>
            <IconButton edge="end" aria-label="move" onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <DriveFileMoveIcon />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={menuAnchor !== null}
              onClose={() => setMenuAnchor(null)}
            >
              {projects
                .filter((p) => p.id !== todo.projectId)
                .map((p) => (
                  <MenuItem
                    key={p.id}
                    onClick={() => {
                      onMove(p.id);
                      setMenuAnchor(null);
                    }}
                  >
                    Move to “{p.name}”
                  </MenuItem>
                ))}
            </Menu>
            <IconButton edge="end" aria-label="edit" onClick={() => setEditing(true)}>
              <EditIcon />
            </IconButton>
            <IconButton edge="end" aria-label="delete" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      >
        <Checkbox checked={todo.isCompleted} onChange={onToggle} />
        <ListItemText
          slotProps={{ secondary: { component: 'div' } }}
          primary={
            <Typography sx={{ textDecoration: todo.isCompleted ? 'line-through' : 'none' }}>
              {todo.title}
            </Typography>
          }
          secondary={
            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}
            >
              {todo.deadlineAt !== null && (
                <Chip size="small" label={`due ${formatDeadline(todo.deadlineAt)}`} />
              )}
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={projectName(todo.projectId, projects)}
              />
              {todo.tags.map((t) => (
                <Chip key={t} size="small" variant="outlined" label={`#${t}`} />
              ))}
            </Stack>
          }
        />
      </ListItem>
    </Paper>
  );
};
