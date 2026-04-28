import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { LoginPage } from './pages/LoginPage';
import { OrganizationSettingsPage } from './pages/OrganizationSettingsPage';
import { OverduePage } from './pages/OverduePage';
import { ProjectPage } from './pages/ProjectPage';
import { RegisterPage } from './pages/RegisterPage';
import { TagPage } from './pages/TagPage';
import { TodosPage } from './pages/TodosPage';
import { UpcomingPage } from './pages/UpcomingPage';

const Protected = ({
  children,
}: {
  children: React.ReactElement;
}): React.ReactElement => {
  const { user } = useAuth();
  if (user === null) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = (): React.ReactElement => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/invite/:token"
      element={
        <Protected>
          <AcceptInvitePage />
        </Protected>
      }
    />
    <Route
      path="/"
      element={
        <Protected>
          <Layout />
        </Protected>
      }
    >
      <Route index element={<TodosPage />} />
      <Route path="upcoming" element={<UpcomingPage />} />
      <Route path="overdue" element={<OverduePage />} />
      <Route path="projects/:projectId" element={<ProjectPage />} />
      <Route path="tags/:name" element={<TagPage />} />
      <Route path="settings/organization" element={<OrganizationSettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
