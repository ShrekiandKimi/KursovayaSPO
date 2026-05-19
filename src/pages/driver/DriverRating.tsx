import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Star, AlertTriangle, Gift } from 'lucide-react';

interface RatingEntry {
  id: string;
  rating: number;
  type: string;
  comment: string;
  amount: number;
  created_at: string;
}

export default function DriverRating() {
  const { profile } = useAuth();
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('driver_ratings')
      .select('*')
      .eq('driver_id', profile.id)
      .order('created_at', { ascending: false });
    setRatings(data || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const avgRating = ratings.filter(r => r.type === 'rating').length > 0
    ? ratings.filter(r => r.type === 'rating').reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.type === 'rating').length
    : 0;

  const totalPenalties = ratings.filter(r => r.type === 'penalty').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalBonuses = ratings.filter(r => r.type === 'bonus').reduce((sum, r) => sum + Number(r.amount), 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Средний рейтинг</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-600">{totalPenalties.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-gray-500 mt-1">Штрафы</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Gift className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{totalBonuses.toLocaleString('ru-RU')} ₽</div>
          <div className="text-xs text-gray-500 mt-1">Бонусы</div>
        </div>
      </div>

      {/* Rating stars visual */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Рейтинг</h3>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-7 h-7 ${
                  star <= Math.round(avgRating)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500">
            {ratings.filter(r => r.type === 'rating').length} оценок
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">История</h3>
        {ratings.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">Записей пока нет</p>
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  {r.type === 'rating' && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {r.type === 'penalty' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Штраф
                    </span>
                  )}
                  {r.type === 'bonus' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <Gift className="w-3 h-3" /> Бонус
                    </span>
                  )}
                  <span className="text-sm text-gray-600">{r.comment || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {(r.type === 'penalty' || r.type === 'bonus') && Number(r.amount) > 0 && (
                    <span className={`text-sm font-semibold ${
                      r.type === 'penalty' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {r.type === 'penalty' ? '-' : '+'}{Number(r.amount).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('ru-RU')}
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
