import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { AuthProvider, useAuth } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/HomePage';
import FormatsPage from '@/pages/FormatsPage';
import FormatDetailPage from '@/pages/FormatDetailPage';
import CasesPage from '@/pages/CasesPage';
import CaseDetailPage from '@/pages/CaseDetailPage';
import UpdatesPage from '@/pages/UpdatesPage';
import NotFoundPage from '@/pages/NotFoundPage';
import HubPage from '@/pages/HubPage';
import NewFormatsPage from '@/pages/NewFormatsPage';
import TeamPage from '@/pages/TeamPage';
import VacationsPage from '@/pages/VacationsPage';
import VacationRequestsPage from '@/pages/VacationRequestsPage';
import PlannerPage from '@/pages/PlannerPage';
import FilesPage from '@/pages/FilesPage';
import BBBPage from '@/pages/BBBPage';
import ManageAccessPage from '@/pages/ManageAccessPage';
import BirthdayCelebration from '@/components/BirthdayCelebration';
import { Loader2 } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-ink-50">
      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
    </div>
  );
}

function AppShell() {
  const { session, loading, isAdmin } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!session) return <LoginPage />;

  return (
    <HashRouter>
      <div className="flex h-screen overflow-hidden bg-ink-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/formatos" element={<FormatsPage />} />
              <Route path="/formatos/:slug" element={<FormatDetailPage />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/cases/:id" element={<CaseDetailPage />} />
              <Route path="/atualizacoes" element={<UpdatesPage />} />
              <Route path="/hub" element={<HubPage />} />
              <Route path="/novos-formatos" element={<NewFormatsPage />} />
              <Route path="/equipe" element={<TeamPage />} />
              <Route path="/ferias" element={<VacationsPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/arquivos" element={<FilesPage />} />
              <Route path="/bbb" element={<BBBPage />} />
              {isAdmin && <Route path="/gerenciar-acessos" element={<ManageAccessPage />} />}
              {isAdmin && <Route path="/solicitacoes-ferias" element={<VacationRequestsPage />} />}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </div>
      <BirthdayCelebration />
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
