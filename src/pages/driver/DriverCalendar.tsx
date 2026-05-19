import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar, Wrench, Heart, CheckCircle } from 'lucide-react';

interface Inspection {
  id: string;
  type: string;
  scheduled_date: string;
  next_date: string;
  completed: boolean;
  notes: string;
  car_id: string | null;
}

export default function DriverCalendar() {
  const { profile } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchInspections = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('inspections')
      .select('*')
      .eq('driver_id', profile.id)
      .order('scheduled_date', { ascending: true });
    setInspections(data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  function getInspectionsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return inspections.filter(
      (i) => i.scheduled_date === dateStr || i.next_date === dateStr
    );
  }

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Календарь ТО и медосмотров
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">
              {currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-16" />;
            const dayInspections = getInspectionsForDay(day);
            const hasTech = dayInspections.some((i) => i.type === 'tech_inspection');
            const hasMedical = dayInspections.some((i) => i.type === 'medical_exam');
            return (
              <div
                key={i}
                className={`h-16 rounded-lg border p-1.5 text-xs transition-colors ${
                  isToday(day)
                    ? 'border-sky-300 bg-sky-50'
                    : dayInspections.length > 0
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-transparent'
                }`}
              >
                <div className={`font-medium ${isToday(day) ? 'text-sky-700' : 'text-gray-700'}`}>{day}</div>
                <div className="mt-0.5 space-y-0.5">
                  {hasTech && (
                    <div className="flex items-center gap-0.5 text-amber-600">
                      <Wrench className="w-2.5 h-2.5" />
                      <span className="truncate">ТО</span>
                    </div>
                  )}
                  {hasMedical && (
                    <div className="flex items-center gap-0.5 text-rose-500">
                      <Heart className="w-2.5 h-2.5" />
                      <span className="truncate">Мед.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <Wrench className="w-3.5 h-3.5 text-amber-600" /> Техосмотр
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-rose-500" /> Медосмотр
        </div>
      </div>

      {/* Upcoming list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Предстоящие осмотры</h3>
        {inspections.filter(i => !i.completed).length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Нет запланированных осмотров</p>
        ) : (
          <div className="space-y-3">
            {inspections.filter(i => !i.completed).map((insp) => (
              <div key={insp.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  {insp.type === 'tech_inspection' ? (
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-amber-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-500" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {insp.type === 'tech_inspection' ? 'Техосмотр' : 'Медосмотр'}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Запланирован на {new Date(insp.scheduled_date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                {insp.next_date && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Следующий</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(insp.next_date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {inspections.filter(i => i.completed).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Пройденные осмотры</h3>
          <div className="space-y-3">
            {inspections.filter(i => i.completed).map((insp) => (
              <div key={insp.id} className="flex items-center gap-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div className="text-sm text-gray-600">
                  {insp.type === 'tech_inspection' ? 'Техосмотр' : 'Медосмотр'} — {new Date(insp.scheduled_date).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
