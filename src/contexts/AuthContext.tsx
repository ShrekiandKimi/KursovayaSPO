import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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
const USERS_KEY = 'taxopark_users';
const SESSION_KEY = 'taxopark_session';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        setUser(parsed.user);
        setProfile(parsed.profile);
      }
    } catch (e) { console.error('Session load error', e); }
    finally { setLoading(false); }
  }, []);

  async function signUp(email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') {
    await new Promise(r => setTimeout(r, 400)); // Имитация сети
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[email]) throw new Error('Email уже зарегистрирован');

    const id = generateId();
    users[email] = { password, id, full_name: fullName, phone, role };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const newProfile: Profile = { id, email, full_name: fullName, phone, role, avatar_url: null, is_active: true, created_at: new Date().toISOString() };

    // Добавляем в список водителей для модератора
    const drivers = JSON.parse(localStorage.getItem('taxopark_drivers') || '[]');
    drivers.unshift({ ...newProfile, assigned_car_id: null });
    localStorage.setItem('taxopark_drivers', JSON.stringify(drivers));

    // Сохраняем сессию
    const sessionData = { user: { id, email }, profile: newProfile };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setUser(sessionData.user);
    setProfile(newProfile);
    window.dispatchEvent(new Event('storage')); // Обновить остальные вкладки
  }

  async function signIn(email: string, password: string) {
    await new Promise(r => setTimeout(r, 300));
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const record = users[email];
    if (!record || record.password !== password) throw new Error('Неверный email или пароль');

    const drivers = JSON.parse(localStorage.getItem('taxopark_drivers') || '[]');
    const foundProfile = drivers.find((d: any) => d.id === record.id) || null;

    const sessionData = { user: { id: record.id, email }, profile: foundProfile };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setUser(sessionData.user);
    setProfile(sessionData.profile);
    window.dispatchEvent(new Event('storage'));
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