import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Car, AlertTriangle, CheckCircle, Wrench, Shield } from 'lucide-react';

interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  color: string;
  vin: string;
  status: string;
  insurance_expiry: string | null;
  tech_inspection_expiry: string | null;
}

export default function DriverCarStatus() {
  const { profile } = useAuth();
  const [car, setCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCar = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('cars')
      .select('*')
      .eq('assigned_driver_id', profile.id)
      .maybeSingle();
    setCar(data as CarData | null);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchCar();
  }, [fetchCar]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  if (!car) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Автомобиль не назначен</h3>
        <p className="text-sm text-gray-500">Обратитесь к модератору для назначения автомобиля</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    active: { label: 'Активен', color: 'text-green-700 bg-green-50', icon: CheckCircle },
    maintenance: { label: 'На обслуживании', color: 'text-amber-700 bg-amber-50', icon: Wrench },
    retired: { label: 'Снят с учёта', color: 'text-red-700 bg-red-50', icon: AlertTriangle },
  };

  const st = statusConfig[car.status] || statusConfig.active;
  const StatusIcon = st.icon;

  const isInsuranceExpiring = car.insurance_expiry
    ? new Date(car.insurance_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;
  const isTechExpiring = car.tech_inspection_expiry
    ? new Date(car.tech_inspection_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="space-y-6">
      {/* Car main info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
              <Car className="w-8 h-8 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{car.make} {car.model}</h2>
              <div className="text-sm text-gray-500 mt-0.5">{car.year} год выпуска</div>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${st.color}`}>
            <StatusIcon className="w-3.5 h-3.5" /> {st.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Гос. номер</div>
            <div className="text-sm font-semibold text-gray-900">{car.plate_number}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Цвет</div>
            <div className="text-sm font-semibold text-gray-900">{car.color || '—'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">VIN</div>
            <div className="text-sm font-semibold text-gray-900 font-mono">{car.vin || '—'}</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Документы
        </h3>
        <div className="space-y-3">
          <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${
            isInsuranceExpiring ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
          }`}>
            <div>
              <div className="text-sm font-medium text-gray-900">Страховка</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {car.insurance_expiry
                  ? `Действует до ${new Date(car.insurance_expiry).toLocaleDateString('ru-RU')}`
                  : 'Не указана'}
              </div>
            </div>
            {isInsuranceExpiring && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Скоро истекает
              </span>
            )}
          </div>

          <div className={`flex items-center justify-between py-3 px-4 rounded-lg border ${
            isTechExpiring ? 'border-amber-200 bg-amber-50' : 'border-gray-200'
          }`}>
            <div>
              <div className="text-sm font-medium text-gray-900">Техосмотр</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {car.tech_inspection_expiry
                  ? `Следующий до ${new Date(car.tech_inspection_expiry).toLocaleDateString('ru-RU')}`
                  : 'Не указан'}
              </div>
            </div>
            {isTechExpiring && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Скоро истекает
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
