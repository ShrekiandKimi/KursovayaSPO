import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useData } from './DataContext';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'moderator' | 'driver';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = 'tp_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { drivers } = useData();

  // Восстановление сессии при загрузке
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        setUser(session.user);
        // Ищем профиль в локальном списке или создаём заглушку
        const localProfile = drivers.find(d => d.id === session.user.id);
        setProfile(localProfile || session.profile);
      }
    } catch (e) {
      console.error('Session load error', e);
    } finally {
      setLoading(false);
    }
  }, [drivers]);

  async function signUp(email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') {
    const response = await api.auth.register({ email, password, full_name: fullName, phone, role });
    if (response.error) throw new Error(response.error);
    
    // После успешной регистрации — сразу логиним
    await signIn(email, password);
  }

  async function signIn(email: string, password: string) {
    const response = await api.auth.login(email, password);
    if (response.error) throw new Error(response.error);
    
    const newProfile: Profile = {
      id: response.user_id,
      email: response.email,
      full_name: response.full_name,
      phone: response.phone,
      role: response.role,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    setUser({ id: response.user_id, email: response.email });
    setProfile(newProfile);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id: response.user_id, email: response.email }, profile: newProfile }));
  }

  function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}