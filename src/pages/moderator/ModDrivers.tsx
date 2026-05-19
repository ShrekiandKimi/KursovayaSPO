import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, UserCheck, UserX, Star, Heart, Wrench } from 'lucide-react';

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface InspectionInfo {
  type: string;
  next_date: string;
  completed: boolean;
}

export default function ModDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [inspections, setInspections] = useState<Record<string, InspectionInfo[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .order('created_at', { ascending: false });
    setDrivers(data || []);

    if (data && data.length > 0) {
      const driverIds = data.map((d: Driver) => d.id);
      const { data: inspData } = await supabase
        .from('inspections')
        .select('driver_id, type, next_date, completed')
        .in('driver_id', driverIds)
        .eq('completed', false);
      const grouped: Record<string, InspectionInfo[]> = {};
      (inspData || []).forEach((i: { driver_id: string; type: string; next_date: string; completed: boolean }) => {
        if (!grouped[i.driver_id]) grouped[i.driver_id] = [];
        grouped[i.driver_id].push({ type: i.type, next_date: i.next_date, completed: i.completed });
      });
      setInspections(grouped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function toggleDriverActive(driver: Driver) {
    await supabase
      .from('profiles')
      .update({ is_active: !driver.is_active })
      .eq('id', driver.id);
    fetchData();
  }

  const filtered = drivers.filter((d) => {
    const matchesSearch = d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search);
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && d.is_active) ||
      (filter === 'inactive' && !d.is_active);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, телефону..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Неактивные'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{drivers.length}</div>
          <div className="text-xs text-gray-500 mt-1">Всего</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{drivers.filter(d => d.is_active).length}</div>
          <div className="text-xs text-gray-500 mt-1">Активных</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{drivers.filter(d => !d.is_active).length}</div>
          <div className="text-xs text-gray-500 mt-1">Заблокированных</div>
        </div>
      </div>

      {/* Drivers list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Водители не найдены</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((driver) => {
              const driverInspections = inspections[driver.id] || [];
              return (
                <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {driver.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{driver.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{driver.email} · {driver.phone}</div>
                        {driverInspections.length > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            {driverInspections.map((insp, i) => (
                              <span key={i} className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                insp.type === 'tech_inspection'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-rose-50 text-rose-600'
                              }`}>
                                {insp.type === 'tech_inspection' ? <Wrench className="w-2.5 h-2.5" /> : <Heart className="w-2.5 h-2.5" />}
                                {new Date(insp.next_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {driver.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                      <button
                        onClick={() => toggleDriverActive(driver)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          driver.is_active
                            ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={driver.is_active ? 'Заблокировать' : 'Активировать'}
                      >
                        {driver.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setSelectedDriver(selectedDriver?.id === driver.id ? null : driver)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {selectedDriver?.id === driver.id && (
                    <DriverDetail driver={driver} inspections={driverInspections} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function DriverDetail({ driver, inspections }: { driver: Driver; inspections: InspectionInfo[] }) {
  const [car, setCar] = useState<{ make: string; model: string; plate_number: string; status: string } | null>(null);
  const [rating, setRating] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data: carData } = await supabase
        .from('cars')
        .select('make, model, plate_number, status')
        .eq('assigned_driver_id', driver.id)
        .maybeSingle();
      setCar(carData as typeof car);

      const { data: ratings } = await supabase
        .from('driver_ratings')
        .select('rating')
        .eq('driver_id', driver.id)
        .eq('type', 'rating');
      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / ratings.length;
        setRating(avg);
      }
    })();
  }, [driver.id]);

  return (
    <div className="mt-3 ml-13 bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <div className="text-xs text-gray-500 mb-1">Автомобиль</div>
        {car ? (
          <div className="text-sm text-gray-900">
            <div className="font-medium">{car.make} {car.model}</div>
            <div className="text-xs text-gray-500">{car.plate_number} · {car.status}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-400">Не назначен</div>
        )}
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Рейтинг</div>
        <div className="flex items-center gap-1">
          {rating > 0 ? (
            <>
              <span className="text-sm font-semibold text-gray-900">{rating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </>
          ) : (
            <span className="text-sm text-gray-400">Нет оценок</span>
          )}
        </div>
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-1">Предстоящие осмотры</div>
        {inspections.length > 0 ? (
          <div className="space-y-1">
            {inspections.map((i, idx) => (
              <div key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                {i.type === 'tech_inspection' ? <Wrench className="w-3 h-3 text-amber-500" /> : <Heart className="w-3 h-3 text-rose-500" />}
                {i.type === 'tech_inspection' ? 'ТО' : 'Медосмотр'} — {new Date(i.next_date).toLocaleDateString('ru-RU')}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Нет</div>
        )}
      </div>
    </div>
  );
}
