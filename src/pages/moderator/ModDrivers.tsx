import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, UserCheck, UserX, Car } from 'lucide-react';

export default function ModDrivers() {
  const { drivers, cars, updateDriverStatus, assignCarToDriver, unassignCar } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = drivers.filter(d => {
    const matchSearch = d.full_name.toLowerCase().includes(search.toLowerCase()) || d.email.includes(search);
    const matchFilter = filter === 'all' || (filter === 'active' && d.is_active) || (filter === 'inactive' && !d.is_active);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Поиск и фильтры */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Поиск по имени, email..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-sky-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Неактивные'}
            </button>
          ))}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-gray-900">{drivers.length}</div><div className="text-xs text-gray-500 mt-1">Всего</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-green-600">{drivers.filter(d => d.is_active).length}</div><div className="text-xs text-gray-500 mt-1">Активных</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-red-500">{drivers.filter(d => !d.is_active).length}</div><div className="text-xs text-gray-500 mt-1">Заблокированных</div></div>
      </div>

      {/* Список водителей */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Водители не найдены</p> : (
          <div className="divide-y divide-gray-100">
            {filtered.map(driver => {
              // Ищем машину, назначенную этому водителю
              const assignedCar = cars.find(c => c.assigned_driver_id === driver.id);
              
              return (
                <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {driver.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{driver.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{driver.email} · {driver.phone}</div>
                        {assignedCar && (
                          <div className="text-xs text-sky-600 mt-1 flex items-center gap-1">
                            <Car className="w-3 h-3" /> {assignedCar.make} {assignedCar.model} ({assignedCar.plate_number})
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {driver.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                      
                      <button onClick={() => updateDriverStatus(driver.id, !driver.is_active)} className={`p-1.5 rounded-lg transition-colors ${driver.is_active ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`} title={driver.is_active ? 'Заблокировать' : 'Активировать'}>
                        {driver.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      
                      {/* Выпадающий список для назначения авто */}
                      <select 
                        value={assignedCar?.id || ''} 
                        onChange={(e) => {
                          if (e.target.value === '') {
                            // Снять авто
                            if (assignedCar) unassignCar(assignedCar.id);
                          } else {
                            // Назначить авто
                            assignCarToDriver(driver.id, e.target.value);
                          }
                        }}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-sky-500 outline-none min-w-[160px]"
                      >
                        <option value="">🚗 Назначить авто...</option>
                        {/* Показываем только свободные машины или ту, что уже назначена */}
                        {cars.filter(c => !c.assigned_driver_id || c.assigned_driver_id === driver.id).map(car => (
                          <option key={car.id} value={car.id}>
                            {car.make} {car.model} ({car.plate_number})
                          </option>
                        ))}
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