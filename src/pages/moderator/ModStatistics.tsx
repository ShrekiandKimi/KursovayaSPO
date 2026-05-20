import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart3, TrendingUp, Users, AlertTriangle, DollarSign, Calendar } from 'lucide-react';

export default function ModStatistics() {
  const { logs, drivers } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');

  const filtered = useMemo(() => {
    const now = new Date(); let startDate: Date | null = null;
    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return logs.filter(l => { if (selectedDriver !== 'all' && l.driver_id !== selectedDriver) return false; if (startDate) return new Date(l.date + 'T00:00:00') >= startDate; return true; }).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, period, selectedDriver]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s, l) => s + (l.revenue || 0), 0);
    const totalTrips = filtered.reduce((s, l) => s + (l.trips_count || 0), 0);
    const accidents = filtered.filter(l => l.had_accident).length;
    const workDays = new Set(filtered.map(l => l.driver_id + '_' + l.date)).size;
    return { totalRevenue, totalTrips, accidents, workDays, avgPerDay: workDays ? totalRevenue / workDays : 0, avgPerTrip: totalTrips ? totalRevenue / totalTrips : 0 };
  }, [filtered]);

  const driverNames = useMemo(() => { const m = new Map<string, string>(); drivers.forEach(d => m.set(d.id, d.full_name)); return m; }, [drivers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">{(['week', 'month', 'all'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}</button>)}</div>
        <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-sky-500 outline-none"><option value="all">Все водители</option>{drivers.filter(d => d.role === 'driver').map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label="Общая выручка" value={`${stats.totalRevenue.toLocaleString('ru-RU')} ₽`} color="text-sky-600" />
        <Stat icon={BarChart3} label="Всего поездок" value={stats.totalTrips.toLocaleString('ru-RU')} color="text-gray-900" />
        <Stat icon={Calendar} label="Отработано смен" value={stats.workDays} color="text-green-600" />
        <Stat icon={AlertTriangle} label="Зафиксировано ДТП" value={stats.accidents} color={stats.accidents > 0 ? 'text-red-600' : 'text-gray-400'} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Stat icon={TrendingUp} label="Средняя выручка за смену" value={`${stats.avgPerDay.toFixed(0)} ₽`} color="text-amber-600" />
        <Stat icon={DollarSign} label="Средний чек" value={`${stats.avgPerTrip.toFixed(0)} ₽`} color="text-emerald-600" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"><h3 className="text-sm font-semibold text-gray-900 px-6 py-4 border-b border-gray-100">Детализация по сменам</h3>{filtered.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Нет данных</p> : (<table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Водитель</th><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Поездки</th><th className="px-4 py-3">Выручка</th><th className="px-4 py-3">Статус</th></tr></thead><tbody className="divide-y divide-gray-100">{filtered.map(l => (<tr key={l.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{driverNames.get(l.driver_id) || 'Неизвестно'}</td><td className="px-4 py-3">{new Date(l.date + 'T00:00:00').toLocaleDateString('ru-RU')}</td><td className="px-4 py-3">{l.trips_count || 0}</td><td className="px-4 py-3 font-semibold">{(l.revenue || 0).toLocaleString('ru-RU')} ₽</td><td className="px-4 py-3">{l.had_accident ? <span className="text-xs text-red-600 font-medium">ДТП</span> : <span className="text-xs text-green-600">Ок</span>}</td></tr>))}</tbody></table>)}</div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) { return (<div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between"><div><div className="text-xs text-gray-500 mb-1">{label}</div><div className={`text-2xl font-bold ${color}`}>{value}</div></div><div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-gray-400" /></div></div>); }