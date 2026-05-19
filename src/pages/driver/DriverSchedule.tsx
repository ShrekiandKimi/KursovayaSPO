import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Calendar } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

export default function DriverSchedule() {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStart, setNewStart] = useState('08:00');
  const [newEnd, setNewEnd] = useState('20:00');
  const [newDayOff, setNewDayOff] = useState(false);

  const fetchSchedules = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('driver_schedules')
      .select('*')
      .eq('driver_id', profile.id)
      .order('date', { ascending: true });
    setSchedules(data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  async function addSchedule() {
    if (!profile || !newDate) return;
    const { error } = await supabase
      .from('driver_schedules')
      .insert({
        driver_id: profile.id,
        date: newDate,
        start_time: newStart,
        end_time: newEnd,
        is_day_off: newDayOff,
      });
    if (!error) {
      setShowAdd(false);
      setNewDate('');
      setNewStart('08:00');
      setNewEnd('20:00');
      setNewDayOff(false);
      fetchSchedules();
    }
  }

  async function deleteSchedule(id: string) {
    await supabase.from('driver_schedules').delete().eq('id', id);
    fetchSchedules();
  }

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Управляйте своим графиком работы</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Добавить смену
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Новая запись</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Дата</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Начало</label>
              <input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                disabled={newDayOff}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Конец</label>
              <input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                disabled={newDayOff}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none disabled:bg-gray-50"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDayOff}
                  onChange={(e) => setNewDayOff(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Выходной</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addSchedule}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Сохранить
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Calendar view */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Расписание
        </h3>
        {schedules.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">График не задан. Добавьте смену.</p>
        ) : (
          <div className="space-y-2">
            {schedules.map((s) => {
              const d = new Date(s.date + 'T00:00:00');
              const dayName = dayNames[d.getDay()];
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg border ${
                    s.is_day_off ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center w-12">
                      <div className="text-xs text-gray-400">{dayName}</div>
                      <div className="text-lg font-bold text-gray-900">{d.getDate()}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                    </div>
                    <div className={`text-sm font-medium ${
                      s.is_day_off ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {s.is_day_off ? 'Выходной' : `${s.start_time.slice(0, 5)} — ${s.end_time.slice(0, 5)}`}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
