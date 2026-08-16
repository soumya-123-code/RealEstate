import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContextProvider } from './context/AuthContext';
import { SocketContextProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { SiteContextProvider } from './context/SiteContext';
import ErrorBoundary from './components/errorBoundary/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';
import GuestOnlyRoute from './components/auth/GuestOnlyRoute';
import AuthLoadingScreen from './components/auth/AuthLoadingScreen';
import { ROLES } from './lib/auth';
import { sanitizeAppPath } from './lib/sanitizeAppPath';

/** Legacy CMS links used /properties — keep them working forever. */
function PropertiesAliasRedirect() {
  const location = useLocation();
  const rest = location.pathname.replace(/^\/properties\/?/, '');
  const suffix = rest ? `/${rest}` : '';
  const target = sanitizeAppPath(`/properties${suffix}${location.search || ''}`, '/list');
  return <Navigate to={target} replace />;
}

// Eager loaded
import Layout from './routes/layout/Layout';
import HomePage from './routes/homePage/HomePage';

// Lazy loaded - public
const ListPage = lazy(() => import('./routes/listPage/ListPage'));
const PropertiesListMapview = lazy(() => import('./routes/propertieslistmapview/PropertiesListMapview'));
const SinglePage = lazy(() => import('./routes/singlePage/SinglePage'));
const ProfilePage = lazy(() => import('./routes/profilePage/ProfilePage'));
const ProfileUpdatePage = lazy(() => import('./routes/profileUpdatePage/ProfileUpdatePage'));
const Login = lazy(() => import('./routes/login/Login'));
const AdminLogin = lazy(() => import('./routes/admin/AdminLogin'));
const AgentLogin = lazy(() => import('./routes/agent/AgentLogin'));
const MyBookings = lazy(() => import('./routes/MyBookings'));
const Register = lazy(() => import('./routes/register/Register'));
const About = lazy(() => import('./routes/about/About'));
const Contact = lazy(() => import('./routes/contact/Contact'));
const NotFound = lazy(() => import('./routes/notFound/NotFound'));
const BlogListPage = lazy(() => import('./routes/blog/BlogListPage'));
const BlogPostPage = lazy(() => import('./routes/blog/BlogPostPage'));
const FaqPage = lazy(() => import('./routes/faq/FaqPage'));
const PrivacyPage = lazy(() => import('./routes/legal/PrivacyPage'));
const TermsPage = lazy(() => import('./routes/legal/TermsPage'));

// Admin pages
const AdminLayout = lazy(() => import('./routes/admin/AdminLayout'));

const AdminDashboard = lazy(() => import('./routes/admin/AdminDashboard'));
const AdminProperties = lazy(() => import('./routes/admin/AdminProperties'));
const AdminAddProperty = lazy(() => import('./routes/admin/AdminAddProperty'));
const AdminEditProperty = lazy(() => import('./routes/admin/AdminEditProperty'));
const AdminBookings = lazy(() => import('./routes/admin/AdminBookings'));
const AdminUsers = lazy(() => import('./routes/admin/AdminUsers'));
const AdminStaff = lazy(() => import('./routes/admin/AdminStaff'));
const AdminChat = lazy(() => import('./routes/admin/AdminChat'));
const AdminSettings = lazy(() => import('./routes/admin/AdminSettings'));

// CMS admin pages
const AdminCmsAnalytics = lazy(() => import('./routes/admin/cms/AdminAnalytics'));
const AdminCmsBanners = lazy(() => import('./routes/admin/cms/AdminBanners'));
const AdminCmsBlogs = lazy(() => import('./routes/admin/cms/AdminBlogs'));
const AdminCmsContacts = lazy(() => import('./routes/admin/cms/AdminContacts'));
const AdminCmsFaqs = lazy(() => import('./routes/admin/cms/AdminFaqs'));
const AdminCmsLeads = lazy(() => import('./routes/admin/cms/AdminLeads'));
const AdminCmsPages = lazy(() => import('./routes/admin/cms/AdminPages'));
const AdminCmsPageEditor = lazy(() => import('./routes/admin/cms/AdminPageEditor'));
const AdminCmsPartners = lazy(() => import('./routes/admin/cms/AdminPartners'));
const AdminCmsSeo = lazy(() => import('./routes/admin/cms/AdminSeo'));
const AdminCmsServices = lazy(() => import('./routes/admin/cms/AdminServices'));
const AdminCmsTeam = lazy(() => import('./routes/admin/cms/AdminTeam'));
const AdminCmsTestimonials = lazy(() => import('./routes/admin/cms/AdminTestimonials'));
const AdminCmsAgents = lazy(() => import('./routes/admin/cms/AdminAgents'));
const AdminCmsNavigation = lazy(() => import('./routes/admin/cms/AdminNavigation'));

// User Chat page
const UserChat = lazy(() => import('./routes/userChat/UserChat'));

// Agent pages
const AgentLayout = lazy(() => import('./routes/agent/AgentLayout'));

const AgentDashboard = lazy(() => import('./routes/agent/AgentDashboard'));

const PageLoader = () => <AuthLoadingScreen message="Loading…" />;

const ws = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const guest = (Component) => (
  <GuestOnlyRoute>{ws(Component)}</GuestOnlyRoute>
);

const auth = (Component) => (
  <ProtectedRoute>{ws(Component)}</ProtectedRoute>
);

const adminPanel = (Component) => (
  <RoleGuard
    allowRoles={[ROLES.ADMIN, ROLES.STAFF]}
    requireAdminPanel
    loginPath="/admin/login"
  >
    {ws(Component)}
  </RoleGuard>
);

const agentPortal = (Component) => (
  <RoleGuard allowRoles={[ROLES.AGENT]} loginPath="/agent/login">
    {ws(Component)}
  </RoleGuard>
);

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      errorElement: <NotFound />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: '/list', element: ws(ListPage) },
        { path: '/properties', element: <PropertiesAliasRedirect /> },
        { path: '/properties/*', element: <PropertiesAliasRedirect /> },
        { path: '/explore', element: ws(PropertiesListMapview) },
        { path: '/property/:id', element: ws(SinglePage) },
        { path: '/profile', element: auth(ProfilePage) },
        { path: '/profile/update', element: auth(ProfileUpdatePage) },
        { path: '/login', element: guest(Login) },
        { path: '/bookings', element: auth(MyBookings) },
        { path: '/register', element: guest(Register) },
        { path: '/about', element: ws(About) },
        { path: '/contact', element: ws(Contact) },
        { path: '/blog', element: ws(BlogListPage) },
        { path: '/blog/:slug', element: ws(BlogPostPage) },
        { path: '/faq', element: ws(FaqPage) },
        { path: '/privacy', element: ws(PrivacyPage) },
        { path: '/terms', element: ws(TermsPage) },
        { path: '/chat', element: auth(UserChat) },
      ],
    },

    { path: '/admin/login', element: guest(AdminLogin) },

    {
      path: '/admin',
      element: adminPanel(AdminLayout),
      errorElement: <NotFound />,
      children: [
        { path: '/admin', element: ws(AdminDashboard) },
        { path: '/admin/properties', element: ws(AdminProperties) },
        { path: '/admin/add-property', element: ws(AdminAddProperty) },
        { path: '/admin/edit-property/:id', element: ws(AdminEditProperty) },
        { path: '/admin/bookings', element: ws(AdminBookings) },
        { path: '/admin/users', element: ws(AdminUsers) },
        { path: '/admin/staff', element: ws(AdminStaff) },
        { path: '/admin/chat', element: ws(AdminChat) },
        { path: '/admin/settings', element: ws(AdminSettings) },

        // CMS management
        { path: '/admin/cms/analytics', element: ws(AdminCmsAnalytics) },
        { path: '/admin/cms/banners', element: ws(AdminCmsBanners) },
        { path: '/admin/cms/blogs', element: ws(AdminCmsBlogs) },
        { path: '/admin/cms/contacts', element: ws(AdminCmsContacts) },
        { path: '/admin/cms/faqs', element: ws(AdminCmsFaqs) },
        { path: '/admin/cms/leads', element: ws(AdminCmsLeads) },
        { path: '/admin/cms/pages', element: ws(AdminCmsPages) },
        { path: '/admin/cms/pages/:key', element: ws(AdminCmsPageEditor) },
        { path: '/admin/cms/partners', element: ws(AdminCmsPartners) },
        { path: '/admin/cms/seo', element: ws(AdminCmsSeo) },
        { path: '/admin/cms/services', element: ws(AdminCmsServices) },
        { path: '/admin/cms/team', element: ws(AdminCmsTeam) },
        { path: '/admin/cms/testimonials', element: ws(AdminCmsTestimonials) },
        { path: '/admin/cms/agents', element: ws(AdminCmsAgents) },
        { path: '/admin/cms/navigation', element: ws(AdminCmsNavigation) },
      ],
    },

    // Staff route (limited access — still requires admin panel permission)
    {
      path: '/staff',
      element: adminPanel(AdminLayout),
      errorElement: <NotFound />,
      children: [
        { path: '/staff', element: ws(AdminDashboard) },
        { path: '/staff/properties', element: ws(AdminProperties) },
        { path: '/staff/bookings', element: ws(AdminBookings) },
        { path: '/staff/chat', element: ws(AdminChat) },
      ],
    },

    { path: '/agent/login', element: guest(AgentLogin) },

    {
      path: '/agent',
      element: agentPortal(AgentLayout),
      errorElement: <NotFound />,
      children: [
        { path: '/agent', element: ws(AgentDashboard) },
      ],
    },
    { path: '*', element: ws(NotFound) },
  ]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthContextProvider>
          <SiteContextProvider>
            <SocketContextProvider>
              <RouterProvider router={router} />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: { background: '#1e2a45', color: '#fff', borderRadius: '12px', padding: '12px 18px' },
                  success: { iconTheme: { primary: '#4ade80', secondary: '#fff' } },
                  error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                }}
              />
            </SocketContextProvider>
          </SiteContextProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
