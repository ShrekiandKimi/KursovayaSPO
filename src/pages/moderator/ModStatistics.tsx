import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';

interface TripData {
  id: string;
  driver_id: string;
  fare: number;
  driver_earnings: number;
  park_earnings: number;
  distance_km: number;
  duration_min: number;
  started_at: string;
  status: string;
}

export default function ModStatistics() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    let startDate: Date;
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const { data } = await supabase
      .from('trips')
      .select('*')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false });
    setTrips(data || []);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const totalFare = trips.reduce((s, t) => s + Number(t.fare), 0);
  const totalParkEarnings = trips.reduce((s, t) => s + Number(t.park_earnings), 0);
  const totalDriverEarnings = trips.reduce((s, t) => s + Number(t.driver_earnings), 0);
  const totalDistance = trips.reduce((s, t) => s + Number(t.distance_km), 0);
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
  const uniqueDrivers = new Set(trips.map(t => t.driver_id)).size;
  const avgFare = completedTrips > 0 ? totalFare / completedTrips : 0;

  // Group by day
  const dailyData: Record<string, { fare: number; trips: number }> = {};
  trips.forEach((t) => {
    const day = new Date(t.started_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    if (!dailyData[day]) dailyData[day] = { fare: 0, trips: 0 };
    dailyData[day].fare += Number(t.fare);
    dailyData[day].trips += 1;
  });

  const maxDailyFare = Math.max(...Object.values(dailyData).map(d => d.fare), 1);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Выручка
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalFare.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <BarChart3 className="w-4 h-4" /> Поездки
          </div>
          <div className="text-2xl font-bold text-gray-900">{completedTrips}</div>
          <div className="text-xs text-red-500 mt-0.5">{cancelledTrips} отмен</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Users className="w-4 h-4" /> Водителей
          </div>
          <div className="text-2xl font-bold text-gray-900">{uniqueDrivers}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <MapPin className="w-4 h-4" /> Средний чек
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgFare.toFixed(0)} ₽</div>
        </div>
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Доход парка</div>
          <div className="text-xl font-bold text-sky-600">{totalParkEarnings.toLocaleString('ru-RU')} ₽</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${totalFare > 0 ? (totalParkEarnings / totalFare) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Заработок водителей</div>
          <div className="text-xl font-bold text-green-600">{totalDriverEarnings.toLocaleString('ru-RU')} ₽</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${totalFare > 0 ? (totalDriverEarnings / totalFare) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Общий пробег</div>
          <div className="text-xl font-bold text-gray-900">{totalDistance.toFixed(0)} км</div>
        </div>
      </div>

      {/* Daily chart */}
      {Object.keys(dailyData).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Выручка по дням</h3>
          <div className="flex items-end gap-1.5 h-48">
            {Object.entries(dailyData).map(([day, data]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-gray-500">{data.fare.toFixed(0)}</div>
                <div
                  className="w-full bg-sky-500 rounded-t-sm min-h-[4px] transition-all hover:bg-sky-400"
                  style={{ height: `${(data.fare / maxDailyFare) * 100}%` }}
                />
                <div className="text-[10px] text-gray-400">{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips per day */}
      {Object.keys(dailyData).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Поездки по дням</h3>
          <div className="space-y-2">
            {Object.entries(dailyData).map(([day, data]) => {
              const maxTrips = Math.max(...Object.values(dailyData).map(d => d.trips), 1);
              return (
                <div key={day} className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 w-12">{day}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(data.trips / maxTrips) * 100}%`, minWidth: '24px' }}
                    >
                      <span className="text-[10px] font-medium text-white">{data.trips}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
