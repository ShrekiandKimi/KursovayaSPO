import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  Car, DollarSign, Calendar, Star, AlertTriangle, Clock,
  LogOut, Menu, X, Bell
} from 'lucide-react';
import DriverIncome from './DriverIncome';
import DriverSchedule from './DriverSchedule';
import DriverRating from './DriverRating';
import DriverCarStatus from './DriverCarStatus';
import DriverCalendar from './DriverCalendar';

type Tab = 'income' | 'schedule' | 'rating' | 'car' | 'calendar';

export default function DriverDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile, signOut } = useAuth();
  const { logs, cars } = useData();
  const [activeTab, setActiveTab] = useState<Tab>('income');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Находим назначенный автомобиль водителя
  const assignedCar = useMemo(() => {
    if (!profile) return null;
    return cars.find(c => c.assigned_driver_id === profile.id) || null;
  }, [profile, cars]);

  // Считаем предстоящие события из локальных данных (страховка, ТО)
  const upcomingReminders = useMemo(() => {
    if (!assignedCar) return [];
    const reminders = [];
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (assignedCar.insurance_expiry) {
      const exp = new Date(assignedCar.insurance_expiry);
      if (exp >= now && exp <= threshold) {
        reminders.push({ type: 'Страховка', date: assignedCar.insurance_expiry });
      }
    }
    if (assignedCar.tech_inspection_expiry) {
      const exp = new Date(assignedCar.tech_inspection_expiry);
      if (exp >= now && exp <= threshold) {
        reminders.push({ type: 'Техосмотр', date: assignedCar.tech_inspection_expiry });
      }
    }
    return reminders;
  }, [assignedCar]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'income', label: 'Доходы', icon: DollarSign },
    { id: 'schedule', label: 'График', icon: Clock },
    { id: 'rating', label: 'Рейтинг', icon: Star },
    { id: 'car', label: 'Авто', icon: Car },
    { id: 'calendar', label: 'Календарь', icon: Calendar },
  ];

  async function handleSignOut() {
    await signOut();
    onNavigate('landing');
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">ТаксоПарк</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-sky-50 rounded-xl p-4 mb-6">
            <div className="font-semibold text-gray-900 text-sm">{profile.full_name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.phone}</div>
            <div className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
              <Car className="w-3 h-3" /> Водитель
            </div>
          </div>

          {upcomingReminders.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium mb-1">
                <Bell className="w-3.5 h-3.5" /> Напоминания
              </div>
              {upcomingReminders.slice(0, 2).map((rem, i) => (
                <div key={i} className="text-xs text-amber-600 mt-1">
                  {rem.type} — {new Date(rem.date).toLocaleDateString('ru-RU')}
                </div>
              ))}
            </div>
          )}

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-fit flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-2">
            {upcomingReminders.length > 0 && (
              <button
                onClick={() => setActiveTab('calendar')}
                className="relative p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Предстоящие события"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {upcomingReminders.length}
                </span>
              </button>
            )}
          </div>
        </header>

        <main className="p-6">
          {activeTab === 'income' && <DriverIncome />}
          {activeTab === 'schedule' && <DriverSchedule />}
          {activeTab === 'rating' && <DriverRating />}
          {activeTab === 'car' && <DriverCarStatus />}
          {activeTab === 'calendar' && <DriverCalendar />}
        </main>
      </div>
    </div>
  );
}