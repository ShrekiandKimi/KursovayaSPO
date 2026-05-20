import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useData } from './DataContext';

export interface Profile { id: string; email: string; full_name: string; phone: string; role: 'moderator' | 'driver'; avatar_url: string | null; is_active: boolean; created_at: string; }

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USERS_KEY = 'tp_users';
const SESSION_KEY = 'tp_session';

function generateId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => (Math.random() * 16 | 0).toString(16)); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { drivers, registerDriver } = useData();

  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) { const p = JSON.parse(s); setUser(p.user); setProfile(drivers.find(d => d.id === p.user.id) || null); }
    } catch { console.error('Session load failed'); }
    finally { setLoading(false); }
  }, [drivers]);

  async function signUp(email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') {
    await new Promise(r => setTimeout(r, 400));
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[email]) throw new Error('Email уже зарегистрирован');
    const id = generateId();
    users[email] = { password, id, full_name: fullName, phone, role };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    registerDriver({ id, email, full_name: fullName, phone, role, is_active: true });
    const newProfile: Profile = { id, email, full_name: fullName, phone, role, avatar_url: null, is_active: true, created_at: new Date().toISOString() };
    setUser({ id, email }); setProfile(newProfile);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id, email }, profile: newProfile }));
  }

  async function signIn(email: string, password: string) {
    await new Promise(r => setTimeout(r, 300));
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const rec = users[email];
    if (!rec || rec.password !== password) throw new Error('Неверный email или пароль');
    const prof = drivers.find(d => d.id === rec.id) || null;
    setUser({ id: rec.id, email }); setProfile(prof);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: { id: rec.id, email }, profile: prof }));
  }

  function signOut() { setUser(null); setProfile(null); localStorage.removeItem(SESSION_KEY); }

  return <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}