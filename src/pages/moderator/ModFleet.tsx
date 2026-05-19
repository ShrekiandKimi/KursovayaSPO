import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Car, AlertTriangle, CheckCircle, Wrench, Plus } from 'lucide-react';

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  color: string;
  vin: string;
  status: string;
  assigned_driver_id: string | null;
  insurance_expiry: string | null;
  tech_inspection_expiry: string | null;
  profiles?: { full_name: string } | null;
}

export default function ModFleet() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newCar, setNewCar] = useState({ make: '', model: '', year: 2024, plate_number: '', color: '', vin: '' });

  const fetchCars = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cars')
      .select('*, profiles!cars_assigned_driver_id_fkey(full_name)')
      .order('created_at', { ascending: false });
    setCars(data as CarData[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  async function addCar() {
    await supabase.from('cars').insert({
      make: newCar.make,
      model: newCar.model,
      year: newCar.year,
      plate_number: newCar.plate_number,
      color: newCar.color,
      vin: newCar.vin,
    });
    setShowAdd(false);
    setNewCar({ make: '', model: '', year: 2024, plate_number: '', color: '', vin: '' });
    fetchCars();
  }

  async function updateCarStatus(car: CarData, status: string) {
    await supabase.from('cars').update({ status }).eq('id', car.id);
    fetchCars();
  }

  const filtered = cars.filter((c) => {
    const matchesSearch = `${c.make} ${c.model} ${c.plate_number}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    active: { label: 'Активен', color: 'text-green-700 bg-green-50', icon: CheckCircle },
    maintenance: { label: 'На обслуживании', color: 'text-amber-700 bg-amber-50', icon: Wrench },
    retired: { label: 'Снят с учёта', color: 'text-red-700 bg-red-50', icon: AlertTriangle },
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по марке, модели, номеру..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Добавить авто
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'maintenance', 'retired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Все' : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{cars.filter(c => c.status === 'active').length}</div>
          <div className="text-xs text-gray-500 mt-1">Активных</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{cars.filter(c => c.status === 'maintenance').length}</div>
          <div className="text-xs text-gray-500 mt-1">На обслуживании</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{cars.filter(c => c.status === 'retired').length}</div>
          <div className="text-xs text-gray-500 mt-1">Снятых с учёта</div>
        </div>
      </div>

      {/* Add car form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Новый автомобиль</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Марка</label>
              <input type="text" value={newCar.make} onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Модель</label>
              <input type="text" value={newCar.model} onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Год</label>
              <input type="number" value={newCar.year} onChange={(e) => setNewCar({ ...newCar, year: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Гос. номер</label>
              <input type="text" value={newCar.plate_number} onChange={(e) => setNewCar({ ...newCar, plate_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Цвет</label>
              <input type="text" value={newCar.color} onChange={(e) => setNewCar({ ...newCar, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
              <input type="text" value={newCar.vin} onChange={(e) => setNewCar({ ...newCar, vin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={addCar} className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">Сохранить</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">Отмена</button>
          </div>
        </div>
      )}

      {/* Cars list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Автомобили не найдены</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((car) => {
              const st = statusConfig[car.status] || statusConfig.active;
              const StIcon = st.icon;
              const isInsuranceExpiring = car.insurance_expiry
                ? new Date(car.insurance_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false;
              const isTechExpiring = car.tech_inspection_expiry
                ? new Date(car.tech_inspection_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : false;

              return (
                <div key={car.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{car.make} {car.model} ({car.year})</div>
                        <div className="text-xs text-gray-500">{car.plate_number} · {car.color}</div>
                        {(isInsuranceExpiring || isTechExpiring) && (
                          <div className="flex items-center gap-1 mt-1 text-amber-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px]">
                              {isInsuranceExpiring && 'Страховка'} {isTechExpiring && 'ТО'} истекает
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                        <StIcon className="w-3 h-3" /> {st.label}
                      </span>
                      <select
                        value={car.status}
                        onChange={(e) => updateCarStatus(car, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:ring-2 focus:ring-sky-500 outline-none"
                      >
                        <option value="active">Активен</option>
                        <option value="maintenance">На обслуживании</option>
                        <option value="retired">Снят с учёта</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
