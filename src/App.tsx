import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import GlobalCursor from "./components/GlobalCursor";
import ProtectedRoute from "./components/ProtectedRoute";

import Index from "./pages/Index";
import ExplorePage from "./pages/ExplorePage";
import AuthPage from "./pages/AuthPage";
import StudioShell from "./components/studio/StudioShell";
import Dashboard from "./pages/studio/Dashboard";
import WorkSession from "./pages/studio/WorkSession";
import Watch from "./pages/studio/Watch";
import OutputLibrary from "./pages/studio/OutputLibrary";
import OutputDetail from "./pages/studio/OutputDetail";
import Projects from "./pages/studio/Projects";
import ProjectDetail from "./pages/studio/ProjectDetail";
import Resources from "./pages/studio/Resources";
import Settings from "./pages/studio/Settings";
import VoiceDnaSettings from "./pages/studio/VoiceDnaSettings";
import TheLot from "./pages/studio/TheLot";

const App = () => (
  <AuthProvider>
    <ThemeProvider>
    <BrowserRouter>
      <GlobalCursor />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/studio" element={<ProtectedRoute><StudioShell /></ProtectedRoute>}>
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
