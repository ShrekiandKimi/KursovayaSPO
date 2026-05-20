import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Calendar } from 'lucide-react';

export default function DriverSchedule() {
  const { profile } = useAuth();
  const { logs, addLog, deleteLog } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '20:00', revenue: 0, trips_count: 0, had_accident: false, notes: '' });

  const myLogs = useMemo(() => {
    if (!profile) return [];
    return logs.filter(l => l.driver_id === profile.id).sort((a, b) => b.date.localeCompare(a.date));
  }, [profile, logs]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addLog({ ...form, driver_id: profile!.id, revenue: Number(form.revenue), trips_count: Number(form.trips_count) });
    setShowAdd(false);
    setForm({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '20:00', revenue: 0, trips_count: 0, had_accident: false, notes: '' });
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Управляйте своим графиком работы</p><button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"><Plus className="w-4 h-4" /> {showAdd ? 'Закрыть' : 'Добавить смену'}</button></div>
      {showAdd && (<form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Дата</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Начало</label><input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Конец</label><input type="time" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
          <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.had_accident} onChange={e => setForm({...form, had_accident: e.target.checked})} className="w-4 h-4 text-amber-600 rounded border-gray-300" /><span className="text-sm text-gray-700">Было ДТП?</span></label></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Поездки</label><input type="number" min="0" required value={form.trips_count} onChange={e => setForm({...form, trips_count: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Выручка (₽)</label><input type="number" min="0" required value={form.revenue} onChange={e => setForm({...form, revenue: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
        </div>
        <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">Сохранить смену</button>
      </form>)}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {myLogs.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Смен пока нет</p> : (<table className="w-full text-sm text-left"><thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Время</th><th className="px-4 py-3">Поездки</th><th className="px-4 py-3">Выручка</th><th className="px-4 py-3 w-10"></th></tr></thead><tbody className="divide-y divide-gray-100">{myLogs.map(l => (<tr key={l.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{new Date(l.date + 'T00:00:00').toLocaleDateString('ru-RU')}</td><td className="px-4 py-3 text-gray-600">{l.start_time} — {l.end_time}</td><td className="px-4 py-3">{l.trips_count}</td><td className="px-4 py-3 font-semibold">{(l.revenue || 0).toLocaleString('ru-RU')} ₽</td><td className="px-4 py-3"><button onClick={() => deleteLog(l.id)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4"/></button></td></tr>))}</tbody></table>)}
      </div>
    </div>
  );
}