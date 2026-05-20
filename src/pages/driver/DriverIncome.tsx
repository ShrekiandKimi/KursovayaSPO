import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { TrendingUp, Clock, DollarSign, MapPin, Calendar } from 'lucide-react';

export default function DriverIncome() {
  const { profile } = useAuth();
  const { logs } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  const myLogs = useMemo(() => {
    if (!profile) return [];
    const now = new Date(); let startDate: Date | null = null;
    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    return logs.filter(l => { if (l.driver_id !== profile.id) return false; if (startDate) return new Date(l.date + 'T00:00:00') >= startDate; return true; }).sort((a, b) => b.date.localeCompare(a.date));
  }, [profile, logs, period]);

  const stats = useMemo(() => {
    const totalEarnings = myLogs.reduce((s, l) => s + (l.revenue || 0), 0);
    const totalTrips = myLogs.reduce((s, l) => s + (l.trips_count || 0), 0);
    const totalHours = myLogs.reduce((s, l) => { const st = new Date(`2000-01-01T${l.start_time || '00:00'}`); const en = new Date(`2000-01-01T${l.end_time || '23:59'}`); return s + (en.getTime() - st.getTime()) / 3600000; }, 0);
    return { totalEarnings, totalTrips, totalHours, avgPerTrip: totalTrips ? totalEarnings / totalTrips : 0 };
  }, [myLogs]);

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    myLogs.forEach(l => { const day = new Date(l.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }); map[day] = (map[day] || 0) + (l.revenue || 0); });
    return Object.entries(map).sort((a, b) => { const [d1, d2] = [a[0].split('.'), b[0].split('.')]; return new Date(2026, Number(d1[1]) - 1, Number(d1[0])).getTime() - new Date(2026, Number(d2[1]) - 1, Number(d2[0])).getTime(); });
  }, [myLogs]);

  const maxDaily = dailyData.length ? Math.max(...dailyData.map(([, v]) => v), 1) : 1;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">{(['week', 'month', 'all'] as const).map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}</button>)}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={DollarSign} label="Заработок" value={`${stats.totalEarnings.toLocaleString('ru-RU')} ₽`} color="text-sky-600" />
        <Stat icon={TrendingUp} label="Поездки" value={stats.totalTrips.toLocaleString('ru-RU')} color="text-gray-900" />
        <Stat icon={Clock} label="Часов" value={`${stats.totalHours.toFixed(1)} ч`} color="text-amber-600" />
        <Stat icon={MapPin} label="Средний чек" value={`${stats.avgPerTrip.toFixed(0)} ₽`} color="text-emerald-600" />
      </div>
      {dailyData.length > 0 && (<div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4" /> График заработка</h3><div className="flex items-end gap-1.5 h-40">{dailyData.map(([day, val]) => (<div key={day} className="flex-1 flex flex-col items-center gap-1"><div className="text-[10px] text-gray-500">{val.toFixed(0)}₽</div><div className="w-full bg-sky-500 rounded-t-sm min-h-[4px] transition-all hover:bg-sky-400" style={{ height: `${(val / maxDaily) * 100}%` }} /><div className="text-[10px] text-gray-400">{day}</div></div>))}</div></div>)}
      <div className="bg-white rounded-xl border border-gray-200 p-6"><h3 className="text-sm font-semibold text-gray-900 mb-4">История смен</h3>{myLogs.length === 0 ? <p className="text-gray-400 text-sm py-8 text-center">Смен пока нет</p> : (<div className="space-y-3">{myLogs.map(l => (<div key={l.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"><div className="flex-1 min-w-0"><div className="text-sm font-medium text-gray-900">{new Date(l.date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="flex items-center gap-3 mt-1 text-xs text-gray-500"><span>{l.start_time} — {l.end_time}</span><span>•</span><span>{l.trips_count} поездок</span>{l.had_accident && <><span>•</span><span className="text-red-500">ДТП</span></>}</div></div><div className="text-right ml-4"><div className="text-sm font-semibold text-gray-900">{(l.revenue || 0).toLocaleString('ru-RU')} ₽</div></div></div>))}</div>)}</div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) { return (<div className="bg-white rounded-xl border border-gray-200 p-5"><div className="flex items-center gap-2 text-gray-500 text-sm mb-2"><Icon className="w-4 h-4" /> {label}</div><div className={`text-2xl font-bold ${color}`}>{value}</div></div>); }