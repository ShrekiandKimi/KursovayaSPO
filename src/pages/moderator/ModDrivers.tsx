import { useState, useMemo, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, UserCheck, UserX, Car, RefreshCw, Pencil, X, Save, AlertCircle } from 'lucide-react';

export default function ModDrivers() {
  const { drivers, cars, assignCarToDriver, unassignCar, updateDriverStatus, updateDriverProfile, refreshDrivers, loading } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Состояние для модального окна редактирования
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' });

  useEffect(() => {
    refreshDrivers();
  }, []);

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

  const allActiveCars = useMemo(() => {
    return cars.filter(c => c.status === 'active');
  }, [cars]);

  // Открытие модалки
  const handleEditClick = (driver: any) => {
    setEditingDriver(driver);
    setEditForm({ full_name: driver.full_name, phone: driver.phone, email: driver.email });
  };

  // Сохранение изменений
  const handleSaveEdit = async () => {
    if (!editingDriver) return;
    try {
      await updateDriverProfile(editingDriver.id, editForm);
      setEditingDriver(null);
    } catch (err) {
      alert('Ошибка при сохранении');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка водителей...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Водители</h2>
          <button onClick={() => refreshDrivers()} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Обновить список">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени, email..." className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : 'Неактивные'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Список водителей */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">{drivers.length === 0 ? 'Водители не найдены в базе' : 'По вашему запросу ничего не найдено'}</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(driver => {
              const assignedCar = cars.find(c => c.id === driver.assigned_car_id);
              
              return (
                <div key={driver.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Информация */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {driver.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{driver.full_name}</div>
                        <div className="text-xs text-gray-500 truncate">{driver.email} · {driver.phone}</div>
                        {assignedCar ? (
                          <div className="text-xs text-sky-600 mt-1 flex items-center gap-1"><Car className="w-3 h-3" />{assignedCar.make} {assignedCar.model} ({assignedCar.plate_number})</div>
                        ) : (
                          <div className="text-xs text-amber-600 mt-1">⚠️ Авто не назначено</div>
                        )}
                      </div>
                    </div>

                    {/* Управление */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Статус */}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${driver.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {driver.is_active ? 'Активен' : 'Заблокирован'}
                      </span>

                      {/* Блокировка */}
                      <button onClick={() => updateDriverStatus(driver.id, !driver.is_active)} className={`p-1.5 rounded-lg transition-colors ${driver.is_active ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`} title={driver.is_active ? 'Заблокировать' : 'Активировать'}>
                        {driver.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      {/*  Кнопка редактирования (Карандаш) */}
                      <button onClick={() => handleEditClick(driver)} className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="Редактировать профиль">
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Выбор авто */}
                      <select value={driver.assigned_car_id || ''} onChange={(e) => {
                        const selectedCarId = e.target.value;
                        if (!selectedCarId) return;
                        if (selectedCarId === 'unassign') {
                          if (driver.assigned_car_id) unassignCar(driver.assigned_car_id);
                        } else {
                          assignCarToDriver(driver.id, selectedCarId);
                        }
                      }} className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-sky-500 outline-none min-w-[180px]">
                        <option value=" ">{driver.assigned_car_id ? ' Сменить авто' : '🚗 Назначить авто...'}</option>
                        {driver.assigned_car_id && <option value="unassign"> Снять авто</option>}
                        {allActiveCars.map(car => {
                          const isAssignedToOther = car.assigned_driver_id && car.assigned_driver_id !== driver.id;
                          return (
                            <option key={car.id} value={car.id} disabled={isAssignedToOther}>
                              {car.make} {car.model} ({car.plate_number}){isAssignedToOther ? ' — занят' : ''}
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

      {/* 🔥 Модальное окно редактирования */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-gray-900">Редактирование профиля</h3>
              <button onClick={() => setEditingDriver(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ФИО Водителя</label>
                <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Телефон</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button onClick={() => setEditingDriver(null)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">Отмена</button>
                <button onClick={handleSaveEdit} className="flex-1 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}