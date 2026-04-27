import { useState } from 'react';
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
} from '@mui/material';
import type { ProjectView } from '../api';

export interface QuickAddInput {
  projectId: string;
  title: string;
  deadlineAt: string | null;
  tagNames: string[];
}

const parseTags = (raw: string): string[] => {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
};

export const QuickAddTodo = ({
  projects,
  defaultProjectId,
  onAdd,
}: {
  projects: readonly ProjectView[];
  defaultProjectId: string | null;
  onAdd: (input: QuickAddInput) => Promise<void>;
}): React.ReactElement => {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tags, setTags] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId ?? '');
  const [busy, setBusy] = useState(false);

  const submit = async (): Promise<void> => {
    if (title.trim().length === 0 || projectId === '') {
      return;
    }
    setBusy(true);
    try {
      await onAdd({
        projectId,
        title: title.trim(),
        deadlineAt: deadline === '' ? null : new Date(deadline).toISOString(),
        tagNames: parseTags(tags),
      });
      setTitle('');
      setDeadline('');
      setTags('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          fullWidth
          label="What needs doing?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void submit();
            }
          }}
        />
        <TextField
          select
          label="Project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          type="datetime-local"
          label="Deadline"
          slotProps={{ inputLabel: { shrink: true } }}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          sx={{ minWidth: 220 }}
        />
        <TextField
          label="Tags (comma-sep.)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <Button
          variant="contained"
          disabled={busy || title.trim().length === 0 || projectId === ''}
          onClick={() => void submit()}
        >
          Add
        </Button>
      </Stack>
    </Paper>
  );
};
