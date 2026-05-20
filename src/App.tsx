import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import ModeratorDashboard from './pages/moderator/ModeratorDashboard';

type Page = 'landing' | 'login' | 'register' | 'driver' | 'moderator';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('landing');

  useEffect(() => {
    if (!loading && user && profile) setPage(profile.role === 'moderator' ? 'moderator' : 'driver');
    else if (!loading && !user) setPage('landing');
  }, [user, profile, loading]);

  const navigate = (p: string) => setPage(p as Page);
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Загрузка...</div>;

  switch (page) {
    case 'landing': return <LandingPage onNavigate={navigate} />;
    case 'login': return <LoginPage onNavigate={navigate} />;
    case 'register': return <RegisterPage onNavigate={navigate} />;
    case 'driver': return <DriverDashboard onNavigate={navigate} />;
    case 'moderator': return <ModeratorDashboard onNavigate={navigate} />;
    default: return <LandingPage onNavigate={navigate} />;
  }
}

export default function App() {
  return <DataProvider><AuthProvider><AppContent /></AuthProvider></DataProvider>;
}