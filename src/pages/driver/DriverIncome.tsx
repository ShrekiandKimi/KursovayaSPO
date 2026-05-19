import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, MapPin, Clock, DollarSign } from 'lucide-react';

interface Trip {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  fare: number;
  driver_earnings: number;
  distance_km: number;
  duration_min: number;
  started_at: string;
  ended_at: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  paid_at: string | null;
}

export default function DriverIncome() {
  const { profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    let startDate: Date | undefined;
    const now = new Date();
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    let query = supabase
      .from('trips')
      .select('*')
      .eq('driver_id', profile.id)
      .order('started_at', { ascending: false });

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString());
    }

    const [tripsRes, paymentsRes] = await Promise.all([
      query,
      supabase
        .from('payments')
        .select('*')
        .eq('driver_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);

    setTrips(tripsRes.data || []);
    setPayments(paymentsRes.data || []);
    setLoading(false);
  }, [profile, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalEarnings = trips.reduce((sum, t) => sum + Number(t.driver_earnings), 0);
  const totalTrips = trips.length;
  const totalDistance = trips.reduce((sum, t) => sum + Number(t.distance_km), 0);
  const avgFare = totalTrips > 0 ? totalEarnings / totalTrips : 0;

  // Group trips by day for chart
  const dailyEarnings: Record<string, number> = {};
  trips.forEach((t) => {
    const day = new Date(t.started_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyEarnings[day] = (dailyEarnings[day] || 0) + Number(t.driver_earnings);
  });

  const maxDaily = Math.max(...Object.values(dailyEarnings), 1);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {(['week', 'month', 'all'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              period === p ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Всё время'}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <DollarSign className="w-4 h-4" /> Заработок
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalEarnings.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Поездки
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalTrips}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <MapPin className="w-4 h-4" /> Расстояние
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalDistance.toFixed(1)} км</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Clock className="w-4 h-4" /> Средний заработок
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgFare.toFixed(0)} ₽</div>
        </div>
      </div>

      {/* Earnings chart */}
      {Object.keys(dailyEarnings).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">График заработка</h3>
          <div className="flex items-end gap-1.5 h-40">
            {Object.entries(dailyEarnings).map(([day, amount]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-gray-500">{amount.toFixed(0)}</div>
                <div
                  className="w-full bg-sky-500 rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${(amount / maxDaily) * 100}%` }}
                />
                <div className="text-[10px] text-gray-400">{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Выплаты</h3>
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(p.period_start).toLocaleDateString('ru-RU')} — {new Date(p.period_end).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {p.status === 'paid' ? `Оплачено ${p.paid_at ? new Date(p.paid_at).toLocaleDateString('ru-RU') : ''}` : 'Ожидает'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{Number(p.amount).toLocaleString('ru-RU')} ₽</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {p.status === 'paid' ? 'Оплачено' : 'Ожидает'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trips list */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">История поездок</h3>
        {trips.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Поездок пока нет</p>
        ) : (
          <div className="space-y-3">
            {trips.slice(0, 20).map((trip) => (
              <div key={trip.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.pickup_address}</span>
                    <span className="text-gray-300">→</span>
                    <span className="truncate">{trip.dropoff_address}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{new Date(trip.started_at).toLocaleDateString('ru-RU')}</span>
                    {Number(trip.distance_km) > 0 && <span>{Number(trip.distance_km).toFixed(1)} км</span>}
                    {trip.duration_min > 0 && <span>{trip.duration_min} мин</span>}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-semibold text-gray-900">{Number(trip.driver_earnings).toLocaleString('ru-RU')} ₽</div>
                  <span className={`text-xs ${trip.status === 'completed' ? 'text-green-600' : 'text-red-500'}`}>
                    {trip.status === 'completed' ? 'Завершена' : 'Отменена'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
