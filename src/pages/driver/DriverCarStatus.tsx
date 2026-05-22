import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Car, Shield, Wrench, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

// ✅ Вспомогательная функция: форматирует "YYYY-MM-DD" → "31 дек. 2026"
function formatDateRU(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  
  const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  const m = parseInt(month, 10) - 1;
  return `${day} ${months[m] || month} ${year}`;
}

// ✅ Проверка: просрочено ли (сравниваем строки "YYYY-MM-DD" лексикографически)
function isExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateStr < todayStr;
}

export default function DriverCarStatus() {
  console.log('✅ DriverCarStatus компонент загрузился');
  console.log(' Cars from context:', cars);
  console.log('👤 Profile from context:', profile);
  const { profile } = useAuth();
  const { cars } = useData();

  const myCar = useMemo(() => {
    if (!profile) return null;
    return cars.find(c => c.assigned_driver_id === profile.id && c.status === 'active') || null;
  }, [profile, cars]);
    // 🔍 ОТЛАДКА: смотри в Console (F12)
  if (myCar) {
    console.log('🔎 DriverCarStatus: myCar dates', {
      insurance: myCar.insurance_expiry,
      tech: myCar.tech_inspection_expiry,
      medical: myCar.medical_inspection_expiry
    });
  }
  if (!myCar) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Нет активного автомобиля</h3>
        <p className="text-sm text-gray-500">Обратитесь к модератору для назначения машины</p>
      </div>
    );
  }

  const statusItems = [
    {
      icon: Shield,
      label: 'Страховка ОСАГО',
      date: myCar.insurance_expiry,
      color: isExpired(myCar.insurance_expiry) ? 'text-red-600 bg-red-50' : 'text-sky-600 bg-sky-50',
      iconColor: isExpired(myCar.insurance_expiry) ? 'text-red-500' : 'text-sky-500',
    },
    {
      icon: Wrench,
      label: 'Техосмотр',
      date: myCar.tech_inspection_expiry,
      color: isExpired(myCar.tech_inspection_expiry) ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50',
      iconColor: isExpired(myCar.tech_inspection_expiry) ? 'text-red-500' : 'text-amber-500',
    },
    {
      icon: Activity,
      label: 'Медосмотр водителя',
      date: myCar.medical_inspection_expiry,
      color: isExpired(myCar.medical_inspection_expiry) ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50',
      iconColor: isExpired(myCar.medical_inspection_expiry) ? 'text-red-500' : 'text-emerald-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Информация об авто */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Car className="w-7 h-7 text-sky-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{myCar.make} {myCar.model}</h3>
            <p className="text-sm text-gray-500">{myCar.plate_number} · {myCar.color} · {myCar.year}</p>
            {myCar.vin && <p className="text-xs text-gray-400 mt-0.5">VIN: {myCar.vin}</p>}
          </div>
                  {/* 🔽 Даты документов (безопасный блок) */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-xs">
          {myCar.insurance_expiry && (
            <div className="bg-sky-50 text-sky-700 px-3 py-2 rounded-lg text-center">
              <div className="opacity-70 mb-1">🛡️ Страховка</div>
              <div className="font-semibold">{myCar.insurance_expiry}</div>
            </div>
          )}
          {myCar.tech_inspection_expiry && (
            <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-center">
              <div className="opacity-70 mb-1">🔧 Техосмотр</div>
              <div className="font-semibold">{myCar.tech_inspection_expiry}</div>
            </div>
          )}
          {myCar.medical_inspection_expiry && (
            <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-center">
              <div className="opacity-70 mb-1">🩺 Медосмотр</div>
              <div className="font-semibold">{myCar.medical_inspection_expiry}</div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Статусы документов */}
      <div className="grid gap-4">
        {statusItems.map((item, idx) => {
          const Icon = item.icon;
          const expired = isExpired(item.date);
          
          return (
            <div key={idx} className={`rounded-xl border p-4 flex items-center justify-between ${expired ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className={`text-xs ${expired ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {expired ? '⚠️ Просрочено' : 'Действует до'}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-semibold ${expired ? 'text-red-700' : 'text-gray-900'}`}>
                  {formatDateRU(item.date)}
                </div>
                {expired && (
                  <button className="mt-1 text-xs text-red-600 hover:text-red-700 font-medium">
                    Сообщить модератору
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Подсказка */}
      <div className="bg-sky-50 rounded-xl border border-sky-200 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700">
            <strong>Важно:</strong> Своевременно проходите техосмотр и медосмотр. 
            При просрочке документов автомобиль может быть временно отстранён от работы.
          </p>
        </div>
      </div>
    </div>
  );
}