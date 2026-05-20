import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { DollarSign, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

export default function ModFinances() {
  const { logs, drivers } = useData();
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  // Считаем финансы на основе локальных логов
  const stats = useMemo(() => {
    const totalFare = logs.reduce((sum, l) => sum + (l.revenue || 0), 0);
    const parkShare = totalFare * 0.15; // Пример: 15% комиссия парка
    const driverShare = totalFare - parkShare;
    
    // Моделируем ожидающие выплаты (30% от заработка водителей)
    const pendingAmount = driverShare * 0.3; 
    
    return { totalFare, parkShare, driverShare, pendingAmount };
  }, [logs]);

  // Группируем логи по водителям для списка выплат
  const financialRecords = useMemo(() => {
    const driverLogs: Record<string, typeof logs> = {};
    logs.forEach(l => {
      if (!driverLogs[l.driver_id]) driverLogs[l.driver_id] = [];
      driverLogs[l.driver_id].push(l);
    });

    return Object.entries(driverLogs).map(([driverId, logsArr]) => {
      const driver = drivers.find(d => d.id === driverId);
      const total = logsArr.reduce((s, l) => s + (l.revenue || 0), 0);
      const count = logsArr.length;
      const dates = logsArr.map(l => l.date).sort();
      
      return {
        driverId,
        driverName: driver?.full_name || 'Неизвестный водитель',
        totalDriverEarnings: total * 0.85,
        totalParkEarnings: total * 0.15,
        tripsCount: count,
        period: dates.length > 0 ? `${dates[0]} — ${dates[dates.length - 1]}` : 'Нет данных',
        status: count > 5 ? 'pending' : 'paid' // Демо-логика статуса
      };
    }).sort((a, b) => b.totalDriverEarnings - a.totalDriverEarnings);
  }, [logs, drivers]);

  const filtered = financialRecords.filter(r => 
    filter === 'all' || r.status === filter
  );

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Общий доход парка" value={`${stats.parkShare.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`} color="text-sky-600" />
        <StatCard icon={TrendingUp} label="Общая выручка" value={`${stats.totalFare.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`} color="text-gray-900" />
        <StatCard icon={Users} label="Заработок водителей" value={`${stats.driverShare.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`} color="text-green-600" />
        <StatCard icon={Clock} label="К выплате" value={`${stats.pendingAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`} color="text-amber-600" />
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'pending' ? 'Ожидают' : 'Оплачено'}
          </button>
        ))}
      </div>

      {/* Список выплат */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Выплат нет</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((record) => (
              <div key={record.driverId} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    record.status === 'paid' ? 'bg-green-50' : 'bg-amber-50'
                  }`}>
                    {record.status === 'paid'
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <Clock className="w-5 h-5 text-amber-600" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{record.driverName}</div>
                    <div className="text-xs text-gray-500">
                      {record.period} · {record.tripsCount} поездок
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{record.totalDriverEarnings.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</span>
                  {record.status === 'pending' && (
                    <button className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                      Оплатить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
        <Icon className="w-4 h-4" /> {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}