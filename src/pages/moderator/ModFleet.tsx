import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Search, Car, AlertTriangle, CheckCircle, Wrench, Plus } from 'lucide-react';

export default function ModFleet() {
  const { cars, addCar, updateCarStatus, unassignCar } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'maintenance' | 'retired'>('all');
  const [showAdd, setShowAdd] = useState(false);
  
  const [newCar, setNewCar] = useState({
    make: '', model: '', year: new Date().getFullYear(), plate_number: '', color: '', vin: '',
    insurance_expiry: '', tech_inspection_expiry: '', medical_inspection_expiry: ''
  });

  const filtered = cars.filter(c => {
    const match = `${c.make} ${c.model} ${c.plate_number}`.toLowerCase().includes(search.toLowerCase());
    return match && (filter === 'all' || c.status === filter);
  });

  const statusConfig = {
    active: { label: 'Активен', color: 'text-green-700 bg-green-50', icon: CheckCircle },
    maintenance: { label: 'На обслуживании', color: 'text-amber-700 bg-amber-50', icon: Wrench },
    retired: { label: 'Снят с учёта', color: 'text-red-700 bg-red-50', icon: AlertTriangle },
  };

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    if (!newCar.make || !newCar.model || !newCar.plate_number) {
      alert('Заполните Марку, Модель и Гос. номер');
      return;
    }

    try {
      await addCar({
        make: newCar.make,
        model: newCar.model,
        year: newCar.year,
        plate_number: newCar.plate_number.toUpperCase(),
        color: newCar.color || null,
        vin: newCar.vin ? newCar.vin.toUpperCase() : null,
        insurance_expiry: newCar.insurance_expiry || null,
        tech_inspection_expiry: newCar.tech_inspection_expiry || null,
        medical_inspection_expiry: newCar.medical_inspection_expiry || null
      });
      
      setNewCar({ make: '', model: '', year: new Date().getFullYear(), plate_number: '', color: '', vin: '', insurance_expiry: '', tech_inspection_expiry: '', medical_inspection_expiry: '' });
      setShowAdd(false);
    } catch (err: any) {
      alert('❌ Ошибка: ' + err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Добавить авто
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'maintenance', 'retired'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Все' : statusConfig[f].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-green-600">{cars.filter(c => c.status === 'active').length}</div><div className="text-xs text-gray-500 mt-1">Активных</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-amber-600">{cars.filter(c => c.status === 'maintenance').length}</div><div className="text-xs text-gray-500 mt-1">На обслуживании</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center"><div className="text-2xl font-bold text-red-500">{cars.filter(c => c.status === 'retired').length}</div><div className="text-xs text-gray-500 mt-1">Снятых</div></div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Новый автомобиль</h3>
          <form onSubmit={handleAddCar} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Марка *</label>
              <input type="text" required value={newCar.make} onChange={e => setNewCar(prev => ({...prev, make: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Модель *</label>
              <input type="text" required value={newCar.model} onChange={e => setNewCar(prev => ({...prev, model: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Гос. номер *</label>
              <input type="text" required value={newCar.plate_number} onChange={e => setNewCar(prev => ({...prev, plate_number: e.target.value.toUpperCase()}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Год</label>
              <input type="number" value={newCar.year} onChange={e => setNewCar(prev => ({...prev, year: Number(e.target.value)}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Цвет</label>
              <input type="text" value={newCar.color} onChange={e => setNewCar(prev => ({...prev, color: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
              <input type="text" value={newCar.vin} onChange={e => setNewCar(prev => ({...prev, vin: e.target.value.toUpperCase()}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Страховка до</label>
              <input type="date" value={newCar.insurance_expiry} onChange={e => setNewCar(prev => ({...prev, insurance_expiry: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ТО до</label>
              <input type="date" value={newCar.tech_inspection_expiry} onChange={e => setNewCar(prev => ({...prev, tech_inspection_expiry: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Медосмотр до</label>
              <input type="date" value={newCar.medical_inspection_expiry} onChange={e => setNewCar(prev => ({...prev, medical_inspection_expiry: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="col-span-2 md:col-span-3 flex gap-2 mt-2">
              <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors">Сохранить</button>
              <button type="button" onClick={() => { setShowAdd(false); setNewCar({ make: '', model: '', year: new Date().getFullYear(), plate_number: '', color: '', vin: '', insurance_expiry: '', tech_inspection_expiry: '', medical_inspection_expiry: '' }); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? <p className="text-gray-400 text-sm py-12 text-center">Авто не найдены</p> : (
          <div className="divide-y divide-gray-100">
            {filtered.map(car => {
              const st = statusConfig[car.status];
              const StatusIcon = st.icon;
              return (
                <div key={car.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-sky-50 rounded-lg flex items-center justify-center"><Car className="w-5 h-5 text-sky-600" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{car.make} {car.model} ({car.year})</div>
                        <div className="text-xs text-gray-500">{car.plate_number} · {car.color}</div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-2">
                          {car.tech_inspection_expiry && <span>🔧 ТО: {new Date(car.tech_inspection_expiry).toLocaleDateString('ru-RU')}</span>}
                          {car.medical_inspection_expiry && <span>🩺 Мед: {new Date(car.medical_inspection_expiry).toLocaleDateString('ru-RU')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}><StatusIcon className="w-3 h-3" /> {st.label}</span>
                      <select value={car.status} onChange={e => updateCarStatus(car.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 focus:ring-2 focus:ring-sky-500 outline-none">
                        <option value="active">Активен</option><option value="maintenance">На обслуживании</option><option value="retired">Снят с учёта</option>
                      </select>
                      {car.assigned_driver_id && <button onClick={() => unassignCar(car.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Отвязать"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>}
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