import { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { BarChart3, TrendingUp, Users, MapPin, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ModStatistics() {
  const { logs, drivers } = useData();
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');

  // Фильтрация логов по периоду и водителю
  const filtered = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return logs
      .filter((log: any) => {
        if (!log) return false;
        if (selectedDriver !== 'all' && log.driver_id !== selectedDriver) return false;
        if (startDate) {
          const logDate = new Date(log.date + 'T00:00:00');
          return logDate >= startDate;
        }
        return true;
      })
      .sort((a: any, b: any) => (b?.date || '').localeCompare(a?.date || ''));
  }, [logs, period, selectedDriver]);

  // Агрегация статистики
  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((s: number, l: any) => s + (l?.revenue || 0), 0);
    const totalTrips = filtered.reduce((s: number, l: any) => s + (l?.trips_count || 0), 0);
    const accidents = filtered.filter((l: any) => l?.had_accident).length;
    const workDays = new Set(filtered.map((l: any) => l?.driver_id + '_' + l?.date)).size;
    return { 
      totalRevenue, 
      totalTrips, 
      accidents, 
      workDays, 
      avgPerDay: workDays ? totalRevenue / workDays : 0, 
      avgPerTrip: totalTrips ? totalRevenue / totalTrips : 0 
    };
  }, [filtered]);

  // Данные для графика по дням
  const dailyData = useMemo(() => {
    const map: Record<string, { revenue: number; trips: number }> = {};
    filtered.forEach((log: any) => {
      if (!log?.date) return;
      const day = new Date(log.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      if (!map[day]) map[day] = { revenue: 0, trips: 0 };
      map[day].revenue += log.revenue || 0;
      map[day].trips += log.trips_count || 0;
    });
    return Object.entries(map).sort((a, b) => {
      const [d1, d2] = [a[0].split('.'), b[0].split('.')];
      return new Date(2026, Number(d1[1]) - 1, Number(d1[0])).getTime() - 
             new Date(2026, Number(d2[1]) - 1, Number(d2[0])).getTime();
    });
  }, [filtered]);

  const maxDaily = dailyData.length > 0 ? Math.max(...dailyData.map(([, d]) => d.revenue), 1) : 1;

  // Имена водителей
  const driverNames = useMemo(() => {
    const map = new Map<string, string>();
    if (drivers && Array.isArray(drivers)) {
      drivers.forEach((d: any) => {
        if (d?.id && d?.full_name) map.set(d.id, d.full_name);
      });
    }
    return map;
  }, [drivers]);

  // 📥 Экспорт в Excel
  const exportToExcel = () => {
    if (filtered.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const exportData = filtered.map((log: any) => ({
      'Водитель': driverNames.get(log.driver_id) || 'Неизвестный',
      'Дата': log.date ? new Date(log.date + 'T00:00:00').toLocaleDateString('ru-RU') : '',
      'Поездки': log.trips_count || 0,
      'Выручка (₽)': log.revenue || 0,
      'ДТП': log.had_accident ? 'Да' : 'Нет',
      'Примечание': log.notes || ''
    }));

    // Добавляем итоговую строку
    exportData.push({
      'Водитель': '',
      'Дата': '',
      'Поездки': 'ИТОГО',
      'Выручка (₽)': stats.totalRevenue,
      'ДТП': '',
      'Примечание': ''
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Настройка ширины колонок
    ws['!cols'] = [
      { wch: 25 }, // Водитель
      { wch: 12 }, // Дата
      { wch: 10 }, // Поездки
      { wch: 15 }, // Выручка
      { wch: 8 },  // ДТП
      { wch: 30 }  // Примечание
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Статистика');
    
    const fileName = `taxopark_stats_${period}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Фильтры + Экспорт */}
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['week', 'month', 'all'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => setPeriod(p)} 
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
              </button>
            ))}
          </div>
          <select 
            value={selectedDriver} 
            onChange={e => setSelectedDriver(e.target.value)} 
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-sky-500 outline-none"
          >
            <option value="all">Все водители</option>
            {drivers?.filter((d: any) => d?.role === 'driver').map((d: any) => (
              <option key={d?.id} value={d?.id}>{d?.full_name}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={exportToExcel}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Экспорт в Excel
        </button>
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Общая выручка" value={`${(stats?.totalRevenue || 0).toLocaleString('ru-RU')} ₽`} color="text-sky-600" />
        <StatCard icon={BarChart3} label="Всего поездок" value={(stats?.totalTrips || 0).toLocaleString('ru-RU')} color="text-gray-900" />
        <StatCard icon={Users} label="Отработано смен" value={stats?.workDays || 0} color="text-green-600" />
        <StatCard icon={MapPin} label="Зафиксировано ДТП" value={stats?.accidents || 0} color={(stats?.accidents || 0) > 0 ? 'text-red-600' : 'text-gray-400'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard icon={TrendingUp} label="Средняя выручка за смену" value={`${(stats?.avgPerDay || 0).toFixed(0)} ₽`} color="text-amber-600" />
        <StatCard icon={MapPin} label="Средний чек" value={`${(stats?.avgPerTrip || 0).toFixed(0)} ₽`} color="text-emerald-600" />
      </div>

      {/* График по дням */}
      {dailyData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Выручка по дням</h3>
          <div className="flex items-end gap-1.5 h-48">
            {dailyData.map(([day, data]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-gray-500">{data.revenue.toFixed(0)}₽</div>
                <div 
                  className="w-full bg-sky-500 rounded-t-sm min-h-[4px] transition-all hover:bg-sky-400" 
                  style={{ height: `${(data.revenue / maxDaily) * 100}%` }} 
                />
                <div className="text-[10px] text-gray-400">{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Детализация */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-900 px-6 py-4 border-b border-gray-100">Детализация по сменам</h3>
        {!filtered || filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Нет данных за выбранный период</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">Водитель</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Поездки</th>
                <th className="px-4 py-3">Выручка</th>
                <th className="px-4 py-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log: any) => (
                <tr key={log?.id || Math.random()} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{driverNames.get(log?.driver_id) || 'Неизвестно'}</td>
                  <td className="px-4 py-3">{log?.date ? new Date(log.date + 'T00:00:00').toLocaleDateString('ru-RU') : '—'}</td>
                  <td className="px-4 py-3">{log?.trips_count || 0}</td>
                  <td className="px-4 py-3 font-semibold">{(log?.revenue || 0).toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3">{log?.had_accident ? <span className="text-xs text-red-600 font-medium">ДТП</span> : <span className="text-xs text-green-600">Ок</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
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