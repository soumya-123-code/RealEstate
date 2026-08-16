import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContextProvider } from './context/AuthContext';
import { SocketContextProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/errorBoundary/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import GuestOnlyRoute from './components/auth/GuestOnlyRoute';
import AuthLoadingScreen from './components/auth/AuthLoadingScreen';
import { ROLES } from './lib/auth';
import { sanitizeAppPath } from './lib/sanitizeAppPath';
import Layout from './routes/layout/Layout';
import HomePage from './routes/homePage/HomePage';

const ListPage = lazy(() => import('./routes/listPage/ListPage'));
const SinglePage = lazy(() => import('./routes/singlePage/SinglePage'));
const ProfilePage = lazy(() => import('./routes/profilePage/ProfilePage'));
const ProfileUpdatePage = lazy(() => import('./routes/profileUpdatePage/ProfileUpdatePage'));
const Login = lazy(() => import('./routes/login/Login'));
const AdminLogin = lazy(() => import('./routes/admin/AdminLogin'));
const AgentLogin = lazy(() => import('./routes/agent/AgentLogin'));
const MyBookings = lazy(() => import('./routes/MyBookings'));
const Register = lazy(() => import('./routes/register/Register'));
const NotFound = lazy(() => import('./routes/notFound/NotFound'));
const UserChat = lazy(() => import('./routes/userChat/UserChat'));

const AdminLayout = lazy(() => import('./routes/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./routes/admin/AdminDashboard'));
const AdminProperties = lazy(() => import('./routes/admin/AdminProperties'));
const AdminAddProperty = lazy(() => import('./routes/admin/AdminAddProperty'));
const AdminEditProperty = lazy(() => import('./routes/admin/AdminEditProperty'));
const AdminBookings = lazy(() => import('./routes/admin/AdminBookings'));
const AdminUsers = lazy(() => import('./routes/admin/AdminUsers'));
const AdminAgents = lazy(() => import('./routes/admin/AdminAgents'));
const AdminChat = lazy(() => import('./routes/admin/AdminChat'));
const AdminSettings = lazy(() => import('./routes/admin/AdminSettings'));

const AgentLayout = lazy(() => import('./routes/agent/AgentLayout'));
const AgentDashboard = lazy(() => import('./routes/agent/AgentDashboard'));
const AgentProperties = lazy(() => import('./routes/agent/AgentProperties'));
const AgentBookings = lazy(() => import('./routes/agent/AgentBookings'));

const PageLoader = () => <AuthLoadingScreen message="Loading…" />;
const ws = (Component) => <Suspense fallback={<PageLoader />}><Component /></Suspense>;
const guest = (Component) => <GuestOnlyRoute>{ws(Component)}</GuestOnlyRoute>;
const auth = (Component) => <ProtectedRoute>{ws(Component)}</ProtectedRoute>;
const adminPanel = (Component) => (
  <RoleGuard allowRoles={[ROLES.ADMIN, ROLES.STAFF]} requireAdminPanel loginPath="/admin/login">
    {ws(Component)}
  </RoleGuard>
);
const agentPortal = (Component) => (
  <RoleGuard allowRoles={[ROLES.AGENT]} loginPath="/agent/login">{ws(Component)}</RoleGuard>
);

function PropertiesAliasRedirect() {
  return <Navigate to={sanitizeAppPath('/properties', '/list')} replace />;
}

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      errorElement: ws(NotFound),
      children: [
        { index: true, element: <HomePage /> },
        { path: 'list', element: ws(ListPage) },
        { path: 'properties', element: <PropertiesAliasRedirect /> },
        { path: 'property/:id', element: ws(SinglePage) },
        { path: 'profile', element: auth(ProfilePage) },
        { path: 'profile/update', element: auth(ProfileUpdatePage) },
        { path: 'login', element: guest(Login) },
        { path: 'bookings', element: auth(MyBookings) },
        { path: 'register', element: guest(Register) },
        { path: 'chat', element: auth(UserChat) },
      ],
    },
    { path: '/admin/login', element: guest(AdminLogin) },
    {
      path: '/admin',
      element: adminPanel(AdminLayout),
      errorElement: ws(NotFound),
      children: [
        { index: true, element: ws(AdminDashboard) },
        { path: 'properties', element: ws(AdminProperties) },
        { path: 'add-property', element: ws(AdminAddProperty) },
        { path: 'edit-property/:id', element: ws(AdminEditProperty) },
        { path: 'bookings', element: ws(AdminBookings) },
        { path: 'users', element: ws(AdminUsers) },
        { path: 'agents', element: ws(AdminAgents) },
        { path: 'chat', element: ws(AdminChat) },
        { path: 'settings', element: ws(AdminSettings) },
      ],
    },
    { path: '/agent/login', element: guest(AgentLogin) },
    {
      path: '/agent',
      element: agentPortal(AgentLayout),
      errorElement: ws(NotFound),
      children: [
        { index: true, element: ws(AgentDashboard) },
        { path: 'properties', element: ws(AgentProperties) },
        { path: 'bookings', element: ws(AgentBookings) },
        { path: 'chat', element: auth(UserChat) },
        { path: 'profile', element: auth(ProfilePage) },
      ],
    },
    { path: '*', element: ws(NotFound) },
  ]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthContextProvider>
          <SocketContextProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          </SocketContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
