import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Star, AlertTriangle, Gift, TrendingUp } from 'lucide-react';

export default function DriverRating() {
  const { profile } = useAuth();
  const { logs } = useData();

  const stats = useMemo(() => {
    if (!profile) return { rating: 5.0, accidents: 0, bonuses: 0, totalLogs: 0 };
    const my = logs.filter(l => l.driver_id === profile.id);
    const accidents = my.filter(l => l.had_accident).length;
    return { rating: Math.max(0, 5.0 - (accidents * 0.2)), accidents, bonuses: 0, totalLogs: my.length };
  }, [profile, logs]);

  const renderStars = (r: number) => Array.from({ length: 5 }, (_, i) => { const s = i + 1; const full = s <= Math.floor(r); const half = !full && s - 0.5 <= r; return (<div key={i} className="relative w-8 h-8"><Star className="w-8 h-8 text-gray-200" /><div className="absolute top-0 left-0 overflow-hidden" style={{ width: full ? '100%' : half ? '50%' : '0%' }}><Star className="w-8 h-8 text-amber-400 fill-amber-400" /></div></div>); });

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6"><h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Ваш рейтинг</h3><span className="text-3xl font-bold text-gray-900">{stats.rating.toFixed(1)}</span></div>
        <div className="flex justify-center gap-1 mb-4">{renderStars(stats.rating)}</div>
        {stats.accidents > 0 ? <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"><AlertTriangle className="w-4 h-4" /> Снижен на {(stats.accidents * 0.2).toFixed(1)} из-за {stats.accidents} ДТП</div> : <p className="text-center text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">✓ Рейтинг максимален</p>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center"><div className="flex items-center justify-center gap-1 mb-2"><TrendingUp className="w-5 h-5 text-gray-400" /></div><div className="text-2xl font-bold text-gray-900">{stats.totalLogs}</div><div className="text-xs text-gray-500 mt-1">Всего смен</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center"><div className="flex items-center justify-center gap-1 mb-2"><AlertTriangle className="w-5 h-5 text-red-400" /></div><div className="text-2xl font-bold text-red-600">{stats.accidents}</div><div className="text-xs text-gray-500 mt-1">ДТП</div></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center"><div className="flex items-center justify-center gap-1 mb-2"><Gift className="w-5 h-5 text-green-500" /></div><div className="text-2xl font-bold text-green-600">{stats.bonuses.toLocaleString('ru-RU')} ₽</div><div className="text-xs text-gray-500 mt-1">Бонусы</div></div>
      </div>
      <div className="bg-sky-50 rounded-xl border border-sky-200 p-4"><p className="text-xs text-sky-700"><strong>Как считается:</strong><br/>Базовый: 5.0 ★ | Каждое ДТП: −0.2 ★ | Минимум: 0.0 ★</p></div>
    </div>
  );
}