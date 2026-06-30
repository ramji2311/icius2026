import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Contact from "./components/Contact";
import Signin from "./components/auth/Signin";
import Login from "./components/auth/Login";
import RouteChangeTracker from "./components/RouteChangeTracker";
import VerifyEmail from "./components/auth/VerifyEmail";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load components for code splitting
const Commitee = lazy(() => import("./components/Commitee"));
const CallForPapers = lazy(() => import("./components/CallforPaper"));
const PaperSubmission = lazy(() => import("./components/Papersubmission"));
const SubmitPaperForm = lazy(() => import("./components/SubmitPaperForm"));
const Dashboard = lazy(() => import("./components/EditorDashboard"));
const ReviewerDashboard = lazy(() => import("./components/ReviewerDashboard"));
const Registrations = lazy(() => import("./components/Registrations"));
const EditSubmission = lazy(() => import("./components/EditSubmission"));
const RevisedPaperSubmissionForm = lazy(() => import("./components/RevisedPaperSubmissionForm"));
const Venue = lazy(() => import('./components/Venue'));
const KeynoteSpeakers = lazy(() => import('./components/KeynoteSpeakers'));
const SpeakerProfile = lazy(() => import('./components/SpeakerProfile'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminPaperSubmission = lazy(() => import('./components/AdminPaperSubmission'));
const AdminPaperAcceptance = lazy(() => import('./components/AdminPaperAcceptance'));
const ReviewerConfirmation = lazy(() => import('./components/ReviewerConfirmation'));
const CopyrightDashboard = lazy(() => import('./components/CopyrightDashboard'));
const AdminCopyrightManagement = lazy(() => import('./components/AdminCopyrightManagement'));
const AuthorRevisionDashboard = lazy(() => import("./components/AuthorRevisionDashboard"));
const AuthorRegistration = lazy(() => import("./components/AuthorRegistration"));

// ─── Spinner shown during auth check ─────────────────────────────────────────
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-3">
      <span className="animate-spin h-10 w-10 rounded-full border-4 border-[#F5A051] border-t-transparent" />
      <p className="text-gray-500 text-sm">Verifying session…</p>
    </div>
  </div>
);

// ─── Protected route: any authenticated user ─────────────────────────────────
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();

  if (status === "loading") return <AuthLoading />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// ─── Role-protected route: checks actual role from JWT via /api/auth/me ───────
const RoleProtectedRoute = ({
  children,
  roles = [],
}: {
  children: React.ReactNode;
  roles?: string[];
}) => {
  const { status, user } = useAuth();

  if (status === "loading") return <AuthLoading />;
  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    // Authenticated but wrong role — redirect to their own dashboard
    switch (user.role) {
      case "Admin":
        return <Navigate to="/admin" replace />;
      case "Editor":
        return <Navigate to="/dashboard" replace />;
      case "Reviewer":
        return <Navigate to="/reviewer" replace />;
      default:
        return <Navigate to="/author-dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// ─── Route wrapper with optional loading animation ────────────────────────────
const RouteWithLoading = ({
  element,
  skipLoading = false,
  loadingTime = 300,
}: {
  element: React.ReactNode;
  skipLoading?: boolean;
  loadingTime?: number;
}) => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-spin h-10 w-10 rounded-full border-4 border-[#F5A051] border-t-transparent" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    }>
      {skipLoading ? (
        <>{element}</>
      ) : (
        <RouteChangeTracker loadingTime={loadingTime}>{element}</RouteChangeTracker>
      )}
    </Suspense>
  );
};

// ─── Route definitions ────────────────────────────────────────────────────────
const AppRoutes = () => {
  const location = useLocation();
  const dashboardRoutes = [
    '/dashboard', '/author-dashboard', '/reviewer', '/reviewer-dashboard',
    '/admin', '/admin/copyrights', '/admin/paper-submission', '/admin/paper-acceptance',
  ];
  const showFooter = !dashboardRoutes.includes(location.pathname);

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<RouteWithLoading element={<Home />} />} />
        <Route path="/contact" element={<RouteWithLoading element={<Contact />} />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/reviewer/confirm" element={<ReviewerConfirmation />} />
        <Route path="/commitee" element={<RouteWithLoading element={<Commitee />} />} />
        <Route path="/call-for-papers" element={<RouteWithLoading element={<CallForPapers />} />} />
        <Route path="/venue" element={<RouteWithLoading element={<Venue />} />} />
        <Route path="/keynote-speakers" element={<RouteWithLoading element={<KeynoteSpeakers />} />} />
        <Route path="/keynote-speakers/:speakerId" element={<RouteWithLoading element={<SpeakerProfile />} />} />

        {/* Admin-only routes */}
        <Route path="/admin" element={
          <RoleProtectedRoute roles={["Admin"]}>
            <RouteWithLoading element={<AdminPanel />} />
          </RoleProtectedRoute>
        } />
        <Route path="/admin/copyrights" element={
          <RoleProtectedRoute roles={["Admin"]}>
            <RouteWithLoading element={<AdminCopyrightManagement />} />
          </RoleProtectedRoute>
        } />
        <Route path="/admin/paper-acceptance" element={
          <RoleProtectedRoute roles={["Admin"]}>
            <RouteWithLoading element={<AdminPaperAcceptance />} />
          </RoleProtectedRoute>
        } />

        {/* Editor + Admin routes */}
        <Route path="/dashboard" element={
          <RoleProtectedRoute roles={["Editor", "Admin"]}>
            <RouteWithLoading element={<Dashboard />} />
          </RoleProtectedRoute>
        } />
        <Route path="/admin/paper-submission" element={
          <RoleProtectedRoute roles={["Admin", "Editor"]}>
            <RouteWithLoading element={<AdminPaperSubmission />} />
          </RoleProtectedRoute>
        } />

        {/* Author-only routes */}
        <Route path="/author-dashboard" element={
          <RoleProtectedRoute roles={["Author"]}>
            <RouteWithLoading element={<CopyrightDashboard />} />
          </RoleProtectedRoute>
        } />
        <Route path="/author-revisions" element={
          <RoleProtectedRoute roles={["Author"]}>
            <RouteWithLoading element={<AuthorRevisionDashboard />} />
          </RoleProtectedRoute>
        } />
        <Route path="/author-registration" element={
          <RoleProtectedRoute roles={["Author"]}>
            <RouteWithLoading element={<AuthorRegistration />} />
          </RoleProtectedRoute>
        } />

        {/* Reviewer-only routes */}
        <Route path="/reviewer" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <RouteWithLoading element={<ReviewerDashboard />} />
          </RoleProtectedRoute>
        } />
        <Route path="/reviewer-dashboard" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <RouteWithLoading element={<ReviewerDashboard />} />
          </RoleProtectedRoute>
        } />
        <Route path="/reviewer/review/:submissionId" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <ReviewerDashboard />
          </RoleProtectedRoute>
        } />

        {/* Any authenticated user */}
        <Route path="/paper-submission" element={
          <ProtectedRoute>
            <RouteWithLoading element={<PaperSubmission />} />
          </ProtectedRoute>
        } />
        <Route path="/submit-paper" element={
          <ProtectedRoute>
            <RouteWithLoading element={<SubmitPaperForm isOpen={true} onClose={() => {}} embedded={false} onSubmissionSuccess={() => {}} />} />
          </ProtectedRoute>
        } />
        <Route path="/registrations" element={
          <ProtectedRoute>
            <RouteWithLoading element={<Registrations />} />
          </ProtectedRoute>
        } />
        <Route path="/edit-submission/:submissionId" element={
          <ProtectedRoute>
            <RouteWithLoading element={<EditSubmission />} />
          </ProtectedRoute>
        } />
        <Route path="/revised-paper/:submissionId" element={
          <ProtectedRoute>
            <RouteWithLoading element={<RevisedPaperSubmissionForm />} />
          </ProtectedRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showFooter && <Footer />}
    </>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ScrollToTop />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;