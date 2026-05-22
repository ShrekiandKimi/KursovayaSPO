import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Calendar, Shield, Wrench, Activity, Car } from 'lucide-react';

type EventType = 'insurance' | 'tech' | 'medical';

interface CalendarEvent {
  date: string;
  type: EventType;
  label: string;
}

export default function DriverCalendar() {
  const { profile } = useAuth();
  const { cars } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Находим назначенный автомобиль
  const myCar = useMemo(() => {
    if (!profile) return null;
    return cars.find(c => c.assigned_driver_id === profile.id);
  }, [profile, cars]);

  // Собираем события из дат авто
  const events: CalendarEvent[] = useMemo(() => {
    if (!myCar) return [];
    const list: CalendarEvent[] = [];
    if (myCar.insurance_expiry) list.push({ date: myCar.insurance_expiry, type: 'insurance', label: 'Страховка' });
    if (myCar.tech_inspection_expiry) list.push({ date: myCar.tech_inspection_expiry, type: 'tech', label: 'ТО' });
    if (myCar.medical_inspection_expiry) list.push({ date: myCar.medical_inspection_expiry, type: 'medical', label: 'Медосмотр' });
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

  function getEventsForDay(day: number): CalendarEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  }

  const today = new Date();
  const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const typeStyles: Record<EventType, { bg: string; text: string; icon: any }> = {
    insurance: { bg: 'bg-sky-100', text: 'text-sky-700', icon: Shield },
    tech: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Wrench },
    medical: { bg: 'bg-rose-100', text: 'text-rose-700', icon: Activity },
  };

  if (!myCar) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет автомобиля</h3>
        <p className="text-sm text-gray-500">Календарь документов появится после назначения машины</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Календарь документов</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[140px] text-center capitalize">{currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d} className="text-center text-xs font-medium text-gray-400 py-2">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) return <div key={i} className="h-24" />;
            const dayEvents = getEventsForDay(day);
            return (
              <div key={i} className={`h-24 rounded-lg border p-1.5 text-xs transition-colors ${isToday(day) ? 'border-sky-300 bg-sky-50' : dayEvents.length > 0 ? 'border-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}>
                <div className={`font-medium mb-1 ${isToday(day) ? 'text-sky-700' : 'text-gray-700'}`}>{day}</div>
                <div className="space-y-1">
                  {dayEvents.map((evt, idx) => {
                    const style = typeStyles[evt.type];
                    const Icon = style.icon;
                    return (
                      <div key={idx} className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`} title={`${evt.label}: ${evt.date}`}>
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{evt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-sky-600" /> Страховка</div>
        <div className="flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-amber-600" /> Техосмотр</div>
        <div className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-rose-600" /> Медосмотр</div>
      </div>
    </div>
  );
}