import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import GlobalCursor from "./components/GlobalCursor";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

import Index from "./pages/Index";
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
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

const App = () => (
  <AuthProvider>
    <ThemeProvider>
    <BrowserRouter>
      <GlobalCursor />
      <Routes>
        <Route path="/" element={<Index />} />
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
              <ProtectedRoute><Onboarding /></ProtectedRoute>
            </Suspense>
          }
        />
        <Route
          path="/studio"
          element={
            <Suspense fallback={<div style={{ background: "#07090f", height: "100vh" }} />}>
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
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/voice" element={<VoiceDnaSettings />} />
          <Route path="lot" element={<TheLot />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  </AuthProvider>
);
export default App;
