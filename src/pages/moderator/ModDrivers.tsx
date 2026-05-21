import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, UserCheck, UserX, Car, RefreshCw } from 'lucide-react';

export default function ModDrivers() {
  const { drivers, cars, assignCarToDriver, unassignCar, updateDriverStatus, refreshDrivers, loading } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Авто-обновление списка при монтировании
  useEffect(() => {
    refreshDrivers();
  }, []);

  // Фильтрация водителей
  const filtered = useMemo(() => {
    return drivers.filter(d => {
      const matchSearch = d.full_name.toLowerCase().includes(search.toLowerCase()) || 
                         d.email.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || 
                         (filter === 'active' && d.is_active) || 
                         (filter === 'inactive' && !d.is_active);
      return matchSearch && matchFilter;
    });
  }, [drivers, search, filter]);

  // Все активные авто для назначения
  const allActiveCars = useMemo(() => {
    return cars.filter(c => c.status === 'active');
  }, [cars]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка водителей...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Заголовок + Обновить */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Водители</h2>
          <button 
            onClick={() => refreshDrivers()} 
            className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
            title="Обновить список"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Поиск по имени, email..." 
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" 
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Неактивные'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Статистика */}
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

      {/* Список водителей */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">
            {drivers.length === 0 ? 'Водители не найдены в базе' : 'По вашему запросу ничего не найдено'}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(driver => {
              // 🔍 Ищем назначенное авто по ID из driver.assigned_car_id
              const assignedCar = cars.find(c => c.id === driver.assigned_car_id);
              
              return (
                <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Информация о водителе */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {driver.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{driver.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{driver.email} · {driver.phone}</div>
                        
                        {/* Отображение назначенного авто */}
                        {assignedCar ? (
                          <div className="text-xs text-sky-600 mt-1 flex items-center gap-1">
                            <Car className="w-3 h-3" /> 
                            {assignedCar.make} {assignedCar.model} ({assignedCar.plate_number})
                          </div>
                        ) : (
                          <div className="text-xs text-amber-600 mt-1">⚠️ Авто не назначено</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Управление */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Статус активности */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {driver.is_active ? 'Активен' : 'Заблокирован'}
                      </span>
                      
                      {/* Кнопка блокировки/разблокировки */}
                      <button 
                        onClick={() => updateDriverStatus(driver.id, !driver.is_active)} 
                        className={`p-1.5 rounded-lg transition-colors ${
                          driver.is_active 
                            ? 'text-red-400 hover:text-red-600 hover:bg-red-50' 
                            : 'text-green-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={driver.is_active ? 'Заблокировать' : 'Активировать'}
                      >
                        {driver.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      
                      {/* Выпадающий список назначения авто */}
                      <select 
                        value={driver.assigned_car_id || ''} 
                        onChange={(e) => {
                          const selectedCarId = e.target.value;
                          if (!selectedCarId) return;
                          
                          if (selectedCarId === 'unassign') {
                            // Снять авто
                            if (driver.assigned_car_id) {
                              unassignCar(driver.assigned_car_id);
                            }
                          } else {
                            // Назначить авто: (driverId, carId)
                            assignCarToDriver(driver.id, selectedCarId);
                          }
                        }}
                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-sky-500 outline-none min-w-[180px]"
                      >
                        <option value="">
                          {driver.assigned_car_id ? '🔄 Сменить авто' : '🚗 Назначить авто...'}
                        </option>
                        
                        {driver.assigned_car_id && (
                          <option value="unassign">⛔ Снять авто</option>
                        )}
                        
                        {/* Список активных авто */}
                        {allActiveCars.map(car => {
                          const isAssignedToOther = car.assigned_driver_id && car.assigned_driver_id !== driver.id;
                          return (
                            <option 
                              key={car.id} 
                              value={car.id}
                              disabled={isAssignedToOther}
                            >
                              {car.make} {car.model} ({car.plate_number})
                              {isAssignedToOther ? ' — занят' : ''}
                            </option>
                          );
                        })}
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