import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Car, AlertTriangle, CheckCircle, Wrench, Plus, UserCheck, UserX } from 'lucide-react';

export default function ModFleet() {
  const { cars, addCar, updateCarStatus, unassignCar, drivers } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [newCar, setNewCar] = useState({ 
    make: '', model: '', year: new Date().getFullYear(), plate_number: '', color: '', vin: '' 
  });

  const filtered = cars.filter((c) => {
    const matchesSearch = `${c.make} ${c.model} ${c.plate_number}`.toLowerCase().includes(search.toLowerCase());
      const statusMatch = filter === 'all' || 
        (filter === 'active' && (c.status === 'active' || c.status === 'Активен')) ||
        (filter === 'maintenance' && (c.status === 'maintenance' || c.status === 'На обслуживании')) ||
        (filter === 'retired' && (c.status === 'retired' || c.status === 'Снят с учёта'));
    return matchesSearch && statusMatch;
  });

  // 📊 Статистика по автопарку
  const stats = {
    active: cars.filter(c => c.status === 'active' || c.status === 'Активен').length,
    inWork: cars.filter(c => (c.status === 'active' || c.status === 'Активен') && c.assigned_driver_id).length,
    available: cars.filter(c => (c.status === 'active' || c.status === 'Активен') && !c.assigned_driver_id).length,
    maintenance: cars.filter(c => c.status === 'maintenance' || c.status === 'На обслуживании').length,
    retired: cars.filter(c => c.status === 'retired' || c.status === 'Снят с учёта').length,
  };

  const statusConfig = { 
    active: { label: 'Активен', color: 'text-green-700 bg-green-50', icon: CheckCircle }, 
    maintenance: { label: 'На обслуживании', color: 'text-amber-700 bg-amber-50', icon: Wrench }, 
    retired: { label: 'Снят с учёта', color: 'text-red-700 bg-red-50', icon: AlertTriangle } 
  };

  function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    if (!newCar.make || !newCar.model || !newCar.plate_number) { 
      alert('Заполните Марку, Модель и Гос. номер'); 
      return; 
    }
    addCar(newCar);
    setNewCar({ make: '', model: '', year: new Date().getFullYear(), plate_number: '', color: '', vin: '' });
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      {/* Поиск и кнопка добавления */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Поиск по марке, модели, номеру..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" 
          />
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Добавить авто
        </button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        {(['all', 'active', 'maintenance', 'retired'] as const).map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f === 'all' ? 'Все' : statusConfig[f].label}
          </button>
        ))}
      </div>

      {/* 📊 Обновлённая статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-gray-500 mt-1">Всего активных</div>
        </div>
        <div className="bg-white rounded-xl border border-sky-200 p-4 text-center">
          <div className="text-2xl font-bold text-sky-600">{stats.inWork}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <UserCheck className="w-3 h-3" /> В работе
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.available}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <UserX className="w-3 h-3" /> Свободны
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.maintenance}</div>
          <div className="text-xs text-gray-500 mt-1">На обслуживании</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{stats.retired}</div>
          <div className="text-xs text-gray-500 mt-1">Снятых с учёта</div>
        </div>
      </div>

      {/* Форма добавления авто */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Новый автомобиль</h3>
          <form onSubmit={handleAddCar} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Марка *</label>
              <input type="text" required value={newCar.make} onChange={e => setNewCar({ ...newCar, make: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Модель *</label>
              <input type="text" required value={newCar.model} onChange={e => setNewCar({ ...newCar, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Гос. номер *</label>
              <input type="text" required value={newCar.plate_number} onChange={e => setNewCar({ ...newCar, plate_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Год</label>
              <input type="number" value={newCar.year} onChange={e => setNewCar({ ...newCar, year: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Цвет</label>
              <input type="text" value={newCar.color} onChange={e => setNewCar({ ...newCar, color: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
              <input type="text" value={newCar.vin} onChange={e => setNewCar({ ...newCar, vin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2 mt-2">
              <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">Сохранить</button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">Отмена</button>
            </div>
          </form>
        </div>
      )}

      {/* Список автомобилей */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Автомобили не найдены</p> : (
          <div className="divide-y divide-gray-100">
            {filtered.map(car => {
              const st = statusConfig[car.status] || statusConfig.active;
              const StatusIcon = st.icon;
              const assignedDriver = drivers.find(d => d.id === car.assigned_driver_id);
              
              return (
                <div key={car.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-sky-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{car.make} {car.model} ({car.year})</div>
                        <div className="text-xs text-gray-500">{car.plate_number} · {car.color}</div>
                        
                        {/* 👤 Информация о водителе */}
                        <div className="mt-1 flex items-center gap-2">
                          {assignedDriver ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                              <UserCheck className="w-3 h-3" /> {assignedDriver.full_name}
                            </span>
                          ) : car.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <UserX className="w-3 h-3" /> Свободен
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                        <StatusIcon className="w-3 h-3" /> {st.label}
                      </span>
                      <select value={car.status} onChange={e => updateCarStatus(car.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:ring-2 focus:ring-sky-500 outline-none">
                        <option value="active">Активен</option>
                        <option value="maintenance">На обслуживании</option>
                        <option value="retired">Снят с учёта</option>
                      </select>
                      {car.assigned_driver_id && (
                        <button onClick={() => unassignCar(car.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Отвязать водителя">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
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