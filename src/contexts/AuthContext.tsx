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

// Генератор UUID для локальной разработки
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
      const stored = localStorage.getItem('taxopark_session');
      if (stored) {
        const { user: u, profile: p } = JSON.parse(stored);
        setUser(u);
        setProfile(p);
      }
    } catch (e) {
      console.error('Failed to load local auth', e);
    } finally {
      setLoading(false);
    }
  }, []);

  async function signUp(email: string, password: string, fullName: string, phone: string, role: 'moderator' | 'driver') {
    await new Promise(r => setTimeout(r, 600)); // Имитация сети
    const id = generateId();
    const newProfile: Profile = {
      id, email, full_name: fullName, phone, role,
      avatar_url: null, is_active: true, created_at: new Date().toISOString()
    };

    // Сохраняем в локальную "БД"
    const usersDb = JSON.parse(localStorage.getItem('taxopark_users_db') || '{}');
    usersDb[email] = { password, profile: newProfile };
    localStorage.setItem('taxopark_users_db', JSON.stringify(usersDb));

    // Автоматический вход после регистрации
    setUser({ id, email });
    setProfile(newProfile);
    localStorage.setItem('taxopark_session', JSON.stringify({ user: { id, email }, profile: newProfile }));
  }

  async function signIn(email: string, password: string) {
    await new Promise(r => setTimeout(r, 400));
    const usersDb = JSON.parse(localStorage.getItem('taxopark_users_db') || '{}');
    const record = usersDb[email];
    if (!record || record.password !== password) {
      throw new Error('Неверный email или пароль');
    }
    setUser({ id: record.profile.id, email });
    setProfile(record.profile);
    localStorage.setItem('taxopark_session', JSON.stringify({ user: { id: record.profile.id, email }, profile: record.profile }));
  }

  function signOut() {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('taxopark_session');
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