import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Plus, Trash2, Calendar, AlertTriangle, Car, DollarSign } from 'lucide-react';

export default function DriverSchedule() {
  const { profile } = useAuth();
  const { logs, addLog, deleteLog } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '20:00', trips_count: 0, total_revenue: 0, had_accident: false, accident_notes: '' });

  if (!profile) return null;
  const myLogs = logs.filter(l => l.driver_id === profile.id).sort((a, b) => b.date.localeCompare(a.date));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addLog({ ...form, driver_id: profile.id, trips_count: Number(form.trips_count), total_revenue: Number(form.total_revenue) });
    setShowForm(false);
    setForm({ date: new Date().toISOString().split('T')[0], start_time: '08:00', end_time: '20:00', trips_count: 0, total_revenue: 0, had_accident: false, accident_notes: '' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Фиксируйте итоги рабочего дня</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> {showForm ? 'Закрыть' : 'Добавить смену'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Дата</label><input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Начало</label><input type="time" required value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Конец</label><input type="time" required value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Кол-во поездок</label><input type="number" min="0" required value={form.trips_count} onChange={e => setForm({...form, trips_count: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Выручка (₽)</label><input type="number" min="0" step="1" required value={form.total_revenue} onChange={e => setForm({...form, total_revenue: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.had_accident} onChange={e => setForm({...form, had_accident: e.target.checked})} className="w-4 h-4 text-amber-600 rounded border-gray-300" /><span className="text-sm text-gray-700">Было ДТП?</span></label>
            </div>
            {form.had_accident && (
              <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Комментарий к ДТП</label><input type="text" value={form.accident_notes} onChange={e => setForm({...form, accident_notes: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" placeholder="Краткое описание" /></div>
            )}
          </div>
          <button type="submit" className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">Сохранить смену</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {myLogs.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Смен пока нет. Добавьте первую.</p> : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Время</th>
                <th className="px-4 py-3">Поездки</th>
                <th className="px-4 py-3">Выручка</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{new Date(log.date + 'T00:00:00').toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-gray-600">{log.start_time} — {log.end_time}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1"><Car className="w-3 h-3 text-gray-400"/> {log.trips_count}</span></td>
                  <td className="px-4 py-3 font-semibold">{log.total_revenue.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3">{log.had_accident ? <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3"/> ДТП</span> : <span className="text-xs text-green-600">Без инцидентов</span>}</td>
                  <td className="px-4 py-3"><button onClick={() => deleteLog(log.id)} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 className="w-4 h-4"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}