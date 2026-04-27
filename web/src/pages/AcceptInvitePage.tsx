import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useOrg } from '../org/OrgContext';

export const AcceptInvitePage = (): React.ReactElement => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setActiveOrgId } = useOrg();
  const [org, setOrg] = useState<{ id: string; name: string; logoPath: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .previewInvite(token)
      .then((o) => {
        if (alive) {
          setOrg(o);
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'invalid invite');
        }
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const accept = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.acceptInvite(token);
      setActiveOrgId(result.organizationId);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to accept');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh', p: 2 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 480 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          You&apos;ve been invited
        </Typography>
        {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {org !== null && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <Avatar src={org.logoPath ?? undefined} sx={{ width: 56, height: 56 }} />
              <Typography variant="h6">{org.name}</Typography>
            </Stack>
            <Button variant="contained" disabled={busy} onClick={() => void accept()}>
              Join {org.name}
            </Button>
            <Button variant="text" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};
