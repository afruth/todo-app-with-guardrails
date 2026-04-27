import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  api,
  type InviteView,
  type MembershipView,
  type ProjectView,
} from '../api';
import { useOrg } from '../org/OrgContext';

const inviteUrl = (token: string): string =>
  `${window.location.origin}/invite/${encodeURIComponent(token)}`;

const ProjectsSection = ({ orgId }: { orgId: string }): React.ReactElement => {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setProjects(await api.listProjects(orgId));
  }, [orgId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = async (): Promise<void> => {
    setError(null);
    if (name.trim().length === 0) {
      return;
    }
    try {
      await api.createProject(orgId, name.trim());
      setName('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    }
  };
  const remove = async (id: string): Promise<void> => {
    setError(null);
    try {
      await api.deleteProject(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Projects
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="New project"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button variant="contained" onClick={() => void create()}>
          Create
        </Button>
      </Stack>
      {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {projects.map((p) => (
          <ListItem
            key={p.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`delete project ${p.name}`}
                onClick={() => void remove(p.id)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={p.name} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

const MembersSection = ({ orgId }: { orgId: string }): React.ReactElement => {
  const [members, setMembers] = useState<MembershipView[]>([]);
  const refresh = useCallback(async () => {
    setMembers(await api.listMembers(orgId));
  }, [orgId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const remove = async (id: string): Promise<void> => {
    await api.removeMember(orgId, id);
    await refresh();
  };
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Members
      </Typography>
      <List>
        {members.map((m) => (
          <ListItem
            key={m.id}
            secondaryAction={
              m.role !== 'owner' ? (
                <IconButton
                  edge="end"
                  aria-label={`remove ${m.userEmail}`}
                  onClick={() => void remove(m.id)}
                >
                  <DeleteIcon />
                </IconButton>
              ) : null
            }
          >
            <ListItemText
              primary={m.userEmail}
              secondary={<Chip size="small" label={m.role} />}
              slotProps={{ secondary: { component: 'div' } }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

const InvitesSection = ({ orgId }: { orgId: string }): React.ReactElement => {
  const [invites, setInvites] = useState<InviteView[]>([]);
  const [emailHint, setEmailHint] = useState('');
  const refresh = useCallback(async () => {
    setInvites(await api.listInvites(orgId));
  }, [orgId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const create = async (): Promise<void> => {
    await api.createInvite(orgId, emailHint.trim() === '' ? null : emailHint.trim());
    setEmailHint('');
    await refresh();
  };
  const revoke = async (id: string): Promise<void> => {
    await api.revokeInvite(orgId, id);
    await refresh();
  };
  const copy = async (token: string): Promise<void> => {
    await navigator.clipboard.writeText(inviteUrl(token));
  };
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Invites
      </Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          label="Email hint (optional)"
          value={emailHint}
          onChange={(e) => setEmailHint(e.target.value)}
        />
        <Button variant="contained" onClick={() => void create()}>
          Create invite link
        </Button>
      </Stack>
      <List>
        {invites.map((i) => {
          const status =
            i.acceptedAt !== null
              ? 'accepted'
              : i.revokedAt !== null
                ? 'revoked'
                : 'pending';
          return (
            <ListItem
              key={i.id}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton aria-label="copy" onClick={() => void copy(i.token)}>
                    <ContentCopyIcon />
                  </IconButton>
                  {status === 'pending' && (
                    <IconButton aria-label="revoke" onClick={() => void revoke(i.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
              }
            >
              <ListItemText
                primary={i.emailHint ?? '(no email hint)'}
                secondary={
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={status} />
                    <Typography variant="caption">{inviteUrl(i.token)}</Typography>
                  </Stack>
                }
                slotProps={{ secondary: { component: 'div' } }}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export const OrganizationSettingsPage = (): React.ReactElement => {
  const { organizations, activeOrgId, refresh } = useOrg();
  const active = organizations.find((o) => o.id === activeOrgId);
  const [name, setName] = useState(active?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(active?.name ?? '');
  }, [active?.name]);

  if (active === undefined) {
    return <Typography>No organization selected.</Typography>;
  }

  const saveName = async (): Promise<void> => {
    setError(null);
    try {
      await api.updateOrganization(active.id, { name: name.trim() });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed');
    }
  };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file === undefined) {
      return;
    }
    setError(null);
    try {
      await api.uploadOrganizationLogo(active.id, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Organization settings
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Avatar src={active.logoPath ?? undefined} sx={{ width: 64, height: 64 }} />
          <Stack>
            <Button
              variant="outlined"
              onClick={() => fileRef.current?.click()}
            >
              Upload logo
            </Button>
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => void onFile(e)}
            />
            <Typography variant="caption" color="text.secondary">
              PNG, JPEG, WEBP up to 1 MB
            </Typography>
          </Stack>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2}>
          <TextField
            label="Organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <Button variant="contained" onClick={() => void saveName()}>
            Save
          </Button>
        </Stack>
        {error !== null && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <ProjectsSection orgId={active.id} />
      <MembersSection orgId={active.id} />
      <InvitesSection orgId={active.id} />
    </Box>
  );
};
