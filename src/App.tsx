import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense, ReactNode } from "react";

import Index from "./pages/Index";
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const StudioShell = lazy(() => import("./components/studio/StudioShell"));
const Dashboard = lazy(() => import("./pages/studio/Dashboard"));
const WorkSession = lazy(() => import("./pages/studio/WorkSession"));
const Watch = lazy(() => import("./pages/studio/Watch"));
const OutputLibrary = lazy(() => import("./pages/studio/OutputLibrary"));
const OutputDetail = lazy(() => import("./pages/studio/OutputDetail"));
const Projects = lazy(() => import("./pages/studio/Projects"));
const ProjectDetail = lazy(() => import("./pages/studio/ProjectDetail"));
const Resources = lazy(() => import("./pages/studio/Resources"));
const Settings = lazy(() => import("./pages/studio/Settings"));
const VoiceDnaSettings = lazy(() => import("./pages/studio/VoiceDnaSettings"));
const Onboarding = lazy(() => import("./pages/studio/Onboarding"));
const TheLot = lazy(() => import("./pages/studio/TheLot"));
const Workbench = lazy(() => import("./pages/studio/Workbench"));
const Wrap = lazy(() => import("./pages/studio/Wrap"));
const VisualWrap = lazy(() => import("./pages/studio/VisualWrap"));
const AdminPanel = lazy(() => import("./pages/studio/AdminPanel"));

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const topLevel = location.pathname.split("/")[1] || "/";
  return (
    <div
      key={topLevel}
      style={{
        animation: "pageEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {children}
    </div>
  );
}

const App = () => (
  <AuthProvider>
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
        <style>{`
          @keyframes pageEnter {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Navigate to="/explore" replace />} />
            <Route
              path="/explore"
              element={
                <Suspense fallback={<div style={{ background: "#07090f", height: "100vh" }} />}>
                  <ExplorePage />
                </Suspense>
              }
            />
            <Route
              path="/auth"
              element={
                <Suspense fallback={<div style={{ background: "#07090f", height: "100vh" }} />}>
                  <AuthPage />
                </Suspense>
              }
            />
            <Route
              path="/onboarding"
              element={
                <Suspense fallback={<div style={{ background: "#07090f", height: "100vh" }} />}>
                  <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                </Suspense>
              }
            />
            <Route
              path="/studio"
              element={
                <Suspense fallback={<div style={{ background: "#F4F2ED", height: "100vh" }} />}>
                  <ProtectedRoute><StudioShell /></ProtectedRoute>
                </Suspense>
              }
            >
              <Route index element={<Navigate to="/studio/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="work" element={<WorkSession />} />
              <Route path="work/:id" element={<WorkSession />} />
              <Route path="watch" element={<Watch />} />
              <Route path="outputs" element={<OutputLibrary />} />
              <Route path="outputs/:id" element={<OutputDetail />} />
              <Route path="wrap" element={<Wrap />} />
              <Route path="wrap/visual/:outputId" element={<VisualWrap />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="resources" element={<Resources />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/voice" element={<VoiceDnaSettings />} />
              <Route path="lot" element={<TheLot />} />
              <Route path="workbench" element={<Workbench />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  </AuthProvider>
);
export default App;
