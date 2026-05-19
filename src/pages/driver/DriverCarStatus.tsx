import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Car, AlertTriangle, CheckCircle, Wrench, Shield } from 'lucide-react';

export default function DriverCarStatus() {
  const { profile } = useAuth();
  const { cars } = useData();
  const [car, setCar] = useState<typeof cars[0] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      const assigned = cars.find(c => c.assigned_driver_id === profile.id) || null;
      setCar(assigned);
      setLoading(false);
    }
  }, [profile, cars]);

  if (loading) return <div className="text-center py-12 text-gray-400">Загрузка...</div>;

  if (!car) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Автомобиль не назначен</h3>
        <p className="text-sm text-gray-500">Обратитесь к модератору для выдачи транспортного средства</p>
      </div>
    );
  }

  const statusConfig = {
    active: { label: 'Активен', color: 'text-green-700 bg-green-50', icon: CheckCircle },
    maintenance: { label: 'На обслуживании', color: 'text-amber-700 bg-amber-50', icon: Wrench },
    retired: { label: 'Снят с учёта', color: 'text-red-700 bg-red-50', icon: AlertTriangle },
  };
  const st = statusConfig[car.status] || statusConfig.active;
  const StatusIcon = st.icon;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center"><Car className="w-8 h-8 text-sky-600" /></div>
            <div><h2 className="text-xl font-bold text-gray-900">{car.make} {car.model}</h2><div className="text-sm text-gray-500 mt-0.5">{car.year} год выпуска</div></div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${st.color}`}><StatusIcon className="w-3.5 h-3.5" /> {st.label}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">Гос. номер</div><div className="text-sm font-semibold text-gray-900">{car.plate_number}</div></div>
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">Цвет</div><div className="text-sm font-semibold text-gray-900">{car.color || '—'}</div></div>
          <div className="bg-gray-50 rounded-lg p-4"><div className="text-xs text-gray-500 mb-1">VIN</div><div className="text-sm font-semibold text-gray-900 font-mono">{car.vin || '—'}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> Документы</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200">
            <div><div className="text-sm font-medium text-gray-900">Страховка</div><div className="text-xs text-gray-500 mt-0.5">Действует до 01.01.2027</div></div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Активна</span>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200">
            <div><div className="text-sm font-medium text-gray-900">Техосмотр</div><div className="text-xs text-gray-500 mt-0.5">Следующий до 15.06.2026</div></div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Скоро истекает</span>
          </div>
        </div>
      </div>
    </div>
  );
}