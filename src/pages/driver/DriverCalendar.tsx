import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Calendar, Shield, Wrench, AlertTriangle, Car } from 'lucide-react';

export default function DriverCalendar() {
  const { profile } = useAuth();
  const { cars } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Находим назначенный автомобиль водителя
  const myCar = useMemo(() => {
    if (!profile) return null;
    return cars.find(c => c.assigned_driver_id === profile.id);
  }, [profile, cars]);

  // Собираем события на основе дат из машины
  const events = useMemo(() => {
    if (!myCar) return [];
    const list = [];
    if (myCar.insurance_expiry) {
      list.push({ date: myCar.insurance_expiry, type: 'insurance', label: 'Страховка' });
    }
    if (myCar.tech_inspection_expiry) {
      list.push({ date: myCar.tech_inspection_expiry, type: 'tech', label: 'Техосмотр' });
    }
    return list;
  }, [myCar]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  function getEventsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  }

  function isExpiringSoon(dateStr: string): boolean {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = d.getTime() - today.getTime();
    return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  }

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  if (!myCar) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет автомобиля</h3>
        <p className="text-sm text-gray-500">Календарь документов будет доступен после назначения машины</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Календарь документов</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center">{currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-20" />;
            const dayEvents = getEventsForDay(day);
            const hasExpiring = dayEvents.some(e => e.date && isExpiringSoon(e.date));
            return (
              <div key={i} className={`h-20 rounded-lg border p-1.5 text-xs transition-colors ${isToday(day) ? 'border-sky-300 bg-sky-50' : hasExpiring ? 'border-amber-300 bg-amber-50' : dayEvents.length > 0 ? 'border-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}>
                <div className={`font-medium ${isToday(day) ? 'text-sky-700' : 'text-gray-700'}`}>{day}</div>
                <div className="mt-0.5 space-y-0.5">
                  {dayEvents.map((evt, idx) => (
                    <div key={idx} className={`flex items-center gap-0.5 text-[10px] ${evt.type === 'insurance' ? 'text-sky-600' : 'text-amber-600'}`} title={`${evt.label}: ${evt.date}`}>
                      {evt.type === 'insurance' ? <Shield className="w-2.5 h-2.5" /> : <Wrench className="w-2.5 h-2.5" />}
                      <span className="truncate">{evt.type === 'insurance' ? 'Страховка' : 'ТО'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-sky-600" /> Страховка</div>
        <div className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-amber-600" /> Техосмотр</div>
        <div className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="w-3.5 h-3.5" /> Истекает скоро</div>
      </div>
    </div>
  );
}