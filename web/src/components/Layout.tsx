import { useEffect, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import {
  Link as RouterLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  PROJECTS_CHANGED_EVENT,
  TAGS_CHANGED_EVENT,
  api,
  type ProjectView,
  type TagView,
} from '../api';
import { useAuth } from '../auth/AuthContext';
import { useOrg } from '../org/OrgContext';

const DRAWER_WIDTH = 260;

const useTags = (orgId: string | null): TagView[] => {
  const [tags, setTags] = useState<TagView[]>([]);
  const location = useLocation();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChanged = (): void => {
      setTick((n) => n + 1);
    };
    window.addEventListener(TAGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, onChanged);
  }, []);
  useEffect(() => {
    if (orgId === null) {
      setTags([]);
      return;
    }
    let alive = true;
    api
      .listTags(orgId)
      .then((data) => alive && setTags(data))
      .catch(() => alive && setTags([]));
    return () => {
      alive = false;
    };
  }, [orgId, location.pathname, tick]);
  return tags;
};

const useProjects = (orgId: string | null): ProjectView[] => {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onChanged = (): void => setTick((n) => n + 1);
    window.addEventListener(PROJECTS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, onChanged);
  }, []);
  useEffect(() => {
    if (orgId === null) {
      setProjects([]);
      return;
    }
    let alive = true;
    api
      .listProjects(orgId)
      .then((data) => alive && setProjects(data))
      .catch(() => alive && setProjects([]));
    return () => {
      alive = false;
    };
  }, [orgId, tick]);
  return projects;
};

const OrgSwitcher = (): React.ReactElement => {
  const { organizations, activeOrgId, setActiveOrgId } = useOrg();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const active = organizations.find((o) => o.id === activeOrgId);

  const submitCreate = async (): Promise<void> => {
    if (name.trim().length === 0) {
      return;
    }
    const org = await api.createOrganization(name.trim());
    setActiveOrgId(org.id);
    setName('');
    setCreating(false);
    navigate('/');
  };

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      {active?.logoPath !== null && active?.logoPath !== undefined && (
        <Avatar src={active.logoPath} sx={{ width: 28, height: 28 }} />
      )}
      <Select
        size="small"
        value={activeOrgId ?? ''}
        onChange={(e) => setActiveOrgId(String(e.target.value))}
        sx={{ minWidth: 180, color: 'inherit', '.MuiSelect-icon': { color: 'inherit' } }}
      >
        {organizations.map((o) => (
          <MenuItem key={o.id} value={o.id}>
            {o.name}
          </MenuItem>
        ))}
      </Select>
      {creating ? (
        <>
          <TextField
            size="small"
            placeholder="Org name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          />
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={() => void submitCreate()}
          >
            Create
          </Button>
          <Button size="small" color="inherit" onClick={() => setCreating(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <Tooltip title="Create organization">
          <IconButton color="inherit" onClick={() => setCreating(true)}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export const Layout = (): React.ReactElement => {
  const { user, logout } = useAuth();
  const { activeOrgId } = useOrg();
  const tags = useTags(activeOrgId);
  const projects = useProjects(activeOrgId);
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Todo
          </Typography>
          <OrgSwitcher />
          <Typography variant="body2">{user?.email}</Typography>
          <IconButton
            component={RouterLink}
            to="/settings/organization"
            color="inherit"
            aria-label="organization settings"
          >
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" aria-label="logout" onClick={() => void logout()}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List dense>
          <ListItemButton component={RouterLink} to="/">
            <ListItemText primary="All todos" />
          </ListItemButton>
          <ListItemButton component={RouterLink} to="/upcoming">
            <ListItemText primary="Upcoming" />
          </ListItemButton>
        </List>
        <Divider />
        <Typography variant="overline" sx={{ pl: 2, pt: 1, color: 'text.secondary' }}>
          Projects
        </Typography>
        <List dense>
          {projects.map((p) => (
            <ListItemButton
              key={p.id}
              component={RouterLink}
              to={`/projects/${p.id}`}
            >
              <ListItemText primary={p.name} />
            </ListItemButton>
          ))}
          {projects.length === 0 && (
            <Box sx={{ pl: 2, color: 'text.secondary', fontSize: 14 }}>(none yet)</Box>
          )}
        </List>
        <Divider />
        <Typography variant="overline" sx={{ pl: 2, pt: 1, color: 'text.secondary' }}>
          Tags
        </Typography>
        <List dense>
          {tags.length === 0 && (
            <Box sx={{ pl: 2, color: 'text.secondary', fontSize: 14 }}>(none yet)</Box>
          )}
          {tags.map((tag) => (
            <ListItemButton
              key={tag.id}
              component={RouterLink}
              to={`/tags/${encodeURIComponent(tag.name)}`}
            >
              <ListItemText primary={`#${tag.name}`} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ p: 2 }}>
          <Button fullWidth variant="outlined" onClick={() => void logout()}>
            Sign out
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};
