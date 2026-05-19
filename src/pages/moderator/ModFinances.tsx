import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

interface PaymentData {
  id: string;
  driver_id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string;
  paid_at: string | null;
  profiles?: { full_name: string } | null;
}

interface TripData {
  driver_earnings: number;
  park_earnings: number;
  fare: number;
}

export default function ModFinances() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [tripStats, setTripStats] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [paymentsRes, tripsRes] = await Promise.all([
      supabase
        .from('payments')
        .select('*, profiles!payments_driver_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('trips')
        .select('driver_earnings, park_earnings, fare'),
    ]);
    setPayments(paymentsRes.data as PaymentData[] || []);
    setTripStats(tripsRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function markAsPaid(payment: PaymentData) {
    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id);
    fetchData();
  }

  const totalParkEarnings = tripStats.reduce((s, t) => s + Number(t.park_earnings), 0);
  const totalDriverEarnings = tripStats.reduce((s, t) => s + Number(t.driver_earnings), 0);
  const totalFare = tripStats.reduce((s, t) => s + Number(t.fare), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPending = pendingPayments.reduce((s, p) => s + Number(p.amount), 0);

  const filtered = payments.filter(p =>
    filter === 'all' || p.status === filter
  );

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <DollarSign className="w-4 h-4" /> Общий доход парка
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalParkEarnings.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp className="w-4 h-4" /> Общая выручка
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalFare.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Users className="w-4 h-4" /> Заработок водителей
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalDriverEarnings.toLocaleString('ru-RU')} ₽</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-2">
            <Clock className="w-4 h-4" /> К выплате
          </div>
          <div className="text-2xl font-bold text-amber-600">{totalPending.toLocaleString('ru-RU')} ₽</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'paid'] as const).map((f) => (
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

      {/* Payments list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">Выплат нет</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((payment) => (
              <div key={payment.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    payment.status === 'paid' ? 'bg-green-50' : 'bg-amber-50'
                  }`}>
                    {payment.status === 'paid'
                      ? <CheckCircle className="w-5 h-5 text-green-600" />
                      : <Clock className="w-5 h-5 text-amber-600" />
                    }
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {payment.profiles?.full_name || 'Неизвестный водитель'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(payment.period_start).toLocaleDateString('ru-RU')} — {new Date(payment.period_end).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{Number(payment.amount).toLocaleString('ru-RU')} ₽</span>
                  {payment.status === 'pending' && (
                    <button
                      onClick={() => markAsPaid(payment)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Оплатить
                    </button>
                  )}
                  {payment.status === 'paid' && payment.paid_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(payment.paid_at).toLocaleDateString('ru-RU')}
                    </span>
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
