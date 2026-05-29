import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  DollarSign, TrendingUp, Users, CreditCard, 
  BarChart3, CalendarDays 
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

// Вспомогательная функция для красивых денег
const formatMoney = (val: number) => val.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';

export default function ModFinances() {
  const { logs, drivers, loading } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  // 1. Фильтрация логов
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const now = new Date();
    let startDate: Date | null = null;
    
    if (period === 'week') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return logs.filter(l => {
      if (!startDate) return true;
      return new Date(l.date) >= startDate;
    });
  }, [logs, period]);

  // 2. Статистика
  const stats = useMemo(() => {
    const totalFare = filteredLogs.reduce((sum, l) => sum + (l.revenue || 0), 0);
    const parkShare = totalFare * 0.15;
    const driverShare = totalFare - parkShare;
    
    return { 
      totalFare: Math.round(totalFare), 
      parkShare: Math.round(parkShare), 
      driverShare: Math.round(driverShare),
      trips: filteredLogs.reduce((s, l) => s + (l.trips_count || 0), 0)
    };
  }, [filteredLogs]);

  // 3. Данные для ГРАФИКА 1: Выручка по водителям
  const revenueByDriver = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach(l => {
      map[l.driver_id] = (map[l.driver_id] || 0) + (l.revenue || 0);
    });

    return Object.entries(map).map(([id, total]) => {
      const driver = drivers.find(d => d.id === id);
      // ✅ ИСПРАВЛЕНИЕ: Если имени нет, показываем ID водителя
      const name = driver?.full_name || `ID: ${id.slice(0, 8)}...`;
      
      return {
        name: name,
        revenue: Math.round(total)
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [filteredLogs, drivers]);

  // 4. Данные для ГРАФИКА 2: Выручка по дням
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    filteredLogs.forEach(l => {
      map[l.date] = (map[l.date] || 0) + (l.revenue || 0);
    });

    return Object.entries(map)
      .map(([date, total]) => ({
        date: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        revenue: Math.round(total)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredLogs]);

  if (loading) return <div className="text-center py-12">Загрузка данных...</div>;

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Финансовый отчет</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p ? 'bg-white text-sky-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
            </button>
          ))}
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Общая выручка" value={formatMoney(stats.totalFare)} color="text-sky-600" />
        <StatCard icon={TrendingUp} label="Поездок" value={stats.trips} color="text-emerald-600" />
        <StatCard icon={CreditCard} label="К выплате (Водители)" value={formatMoney(stats.driverShare)} color="text-green-600" />
        <StatCard icon={BarChart3} label="Доход парка (15%)" value={formatMoney(stats.parkShare)} color="text-amber-600" />
      </div>

      {/* ГРАФИКИ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График 1: Выручка по водителям */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Топ водителей по выручке
          </h3>
          <div className="h-64 w-full">
            {revenueByDriver.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={revenueByDriver} 
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }} // ✅ Увеличили отступы
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  {/* ✅ Форматирование оси Y */}
                  <YAxis 
                    tickFormatter={(val) => val.toLocaleString('ru-RU')} 
                    width={60} // ✅ Фиксированная ширина для цифр
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  {/* ✅ Русский язык в тултипе */}
                  <Tooltip 
                    formatter={(val: number) => [formatMoney(val), 'Выручка']} 
                    labelStyle={{ color: '#333' }}
                  />
                  <Bar dataKey="revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Нет данных</div>
            )}
          </div>
        </div>

        {/* График 2: Динамика выручки по дням */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Динамика выручки по дням
          </h3>
          <div className="h-64 w-full">
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueByDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => val.toLocaleString('ru-RU')} width={50} />
                  {/* ✅ Русский язык в тултипе */}
                  <Tooltip formatter={(val: number) => [formatMoney(val), 'Выручка']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">Нет данных</div>
            )}
          </div>
        </div>
      </div>

      {/* Таблица последних смен */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900">Последние смены</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{filteredLogs.length} записей</span>
        </div>
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">Смен за этот период не найдено</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Водитель</th>
                  <th className="px-6 py-3 font-medium">Дата</th>
                  <th className="px-6 py-3 font-medium">Поездки</th>
                  <th className="px-6 py-3 font-medium text-right">Выручка</th>
                  <th className="px-6 py-3 font-medium text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.slice(0, 10).map((log) => {
                  const driver = drivers.find(d => d.id === log.driver_id);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                            {(driver?.full_name?.[0] || log.driver_id[0]).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">
                            {/* ✅ ИСПРАВЛЕНИЕ: Показываем ID, если имя не найдено */}
                            {driver?.full_name || `ID: ${log.driver_id.slice(0, 8)}...`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {new Date(log.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {log.trips_count}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-gray-900">
                        {(log.revenue || 0).toLocaleString()} ₽
                      </td>
                      <td className="px-6 py-3 text-center">
                        {log.had_accident ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full border border-red-100">ДТП</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-medium rounded-full border border-green-100">Норма</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-start justify-between">
      <div>
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </div>
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}