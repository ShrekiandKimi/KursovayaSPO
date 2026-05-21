import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Users, Car, DollarSign, BarChart3, LogOut, Menu, X,
  ShieldCheck
} from 'lucide-react';
import ModDrivers from './ModDrivers';
import ModFleet from './ModFleet';
import ModFinances from './ModFinances';
import ModStatistics from './ModStatistics';

type Tab = 'drivers' | 'fleet' | 'finances' | 'statistics';

export default function ModeratorDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('drivers');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'drivers', label: 'Водители', icon: Users },
    { id: 'fleet', label: 'Автопарк', icon: Car },
    { id: 'finances', label: 'Финансы', icon: DollarSign },
    { id: 'statistics', label: 'Статистика', icon: BarChart3 },
  ];

  async function handleSignOut() {
    await signOut();
    onNavigate('landing');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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
            <div className="font-semibold text-gray-900 text-sm">{profile?.full_name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile?.email}</div>
            <div className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Модератор
            </div>
          </div>

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

      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {tabs.find(t => t.id === activeTab)?.label}
          </h1>
          <div />
        </header>

        <main className="p-6">
          {activeTab === 'drivers' && <ModDrivers />}
          {activeTab === 'fleet' && <ModFleet />}
          {activeTab === 'finances' && <ModFinances />}
          {activeTab === 'statistics' && <ModStatistics />}
        </main>
      </div>
    </div>
  );
}
