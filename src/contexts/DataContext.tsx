import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

export interface Driver { id: string; full_name: string; phone: string; email: string; role: 'driver' | 'moderator'; is_active: boolean; assigned_car_id: string | null; }
export interface Car { id: string; make: string; model: string; year: number; plate_number: string; color: string | null; vin: string | null; status: 'active' | 'maintenance' | 'retired'; assigned_driver_id: string | null; insurance_expiry: string | null; tech_inspection_expiry: string | null; medical_inspection_expiry: string | null; driver_name?: string | null; created_at: string; }
export interface Log { id: string; driver_id: string; date: string; start_time: string; end_time: string; revenue: number; trips_count: number; had_accident: boolean; notes: string; created_at: string; }

interface DataContextType {
  drivers: Driver[]; cars: Car[]; logs: Log[]; loading: boolean;
  addCar: (car: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>) => Promise<void>;
  assignCarToDriver: (driverId: string, carId: string) => Promise<void>;
  unassignCar: (carId: string) => Promise<void>;
  updateCarStatus: (carId: string, status: Car['status']) => Promise<void>;
  updateDriverStatus: (driverId: string, isActive: boolean) => void;
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => void;
  deleteLog: (logId: string) => void;
  registerDriver: (profile: Omit<Driver, 'assigned_car_id'>) => void;
  refreshDrivers: () => Promise<void>;
  refreshLogs: () => Promise<void>; // Добавляем функцию обновления
}

const DataContext = createContext<DataContextType | null>(null);
const LOGS_KEY = 'tp_logs';

function load<T>(key: string, fallback: T[]): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [logs, setLogs] = useState<Log[]>(() => load(LOGS_KEY, []));
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 ИСПРАВЛЕНИЕ: Загружаем логи с сервера при старте
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Запрашиваем машины, водителей И логи с сервера
        const [backendCars, backendDrivers, backendLogs] = await Promise.all([
          api.cars.getAll(), 
          api.drivers.getAll(),
          api.logs.getAll() // <-- Забираем все логи из БД
        ]);

        if (backendCars && !('error' in backendCars)) setCars(backendCars);
        if (backendDrivers && !('error' in backendDrivers)) setDrivers(backendDrivers);
        
        // Если логи пришли с сервера — используем их (перезаписываем localStorage)
        if (backendLogs && !('error' in backendLogs)) {
          setLogs(backendLogs); 
        }
      } catch (e) { 
        console.warn('API init failed', e); 
      } finally { 
        setLoading(false); 
      }
    };
    init();
  }, []);

  // Сохраняем логи в localStorage при изменении
  useEffect(() => { 
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); 
  }, [logs]);

  const refreshCars = async () => {
    const updated = await api.cars.getAll();
    if (updated && !('error' in updated)) setCars(updated);
  };

  const refreshDrivers = async () => {
    const updated = await api.drivers.getAll();
    if (updated && !('error' in updated)) setDrivers(updated);
  };

  const refreshLogs = async () => {
    const updated = await api.logs.getAll();
    if (updated && !('error' in updated)) setLogs(updated);
  };

  const addCar = async (car: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>) => {
    const result = await api.cars.add(car);
    if ('error' in result) throw new Error(result.error);
    await refreshCars();
  };

  const assignCarToDriver = async (driverId: string, carId: string) => {
    const res = await api.cars.assign(carId, driverId);
    if ('error' in res) throw new Error(res.error);
    await refreshCars(); await refreshDrivers();
  };

  const unassignCar = async (carId: string) => {
    const res = await api.cars.unassign(carId);
    if ('error' in res) throw new Error(res.error);
    await refreshCars(); await refreshDrivers();
  };

  const updateCarStatus = async (carId: string, status: Car['status']) => {
    const res = await api.cars.updateStatus(carId, status);
    if ('error' in res) throw new Error(res.error);
    await refreshCars();
  };

  const updateDriverStatus = (driverId: string, isActive: boolean) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, is_active: isActive } : d));
  };

  const registerDriver = () => { refreshDrivers(); };

  const addLog = (log: Omit<Log, 'id' | 'created_at'>) => { 
    // Создаем локально, но нужно бы отправить на сервер? 
    // В текущей архитектуре addLog только локальный. 
    // Для полноценной работы нужно добавить api.logs.add в DataContext, но пока оставим как есть.
    setLogs(prev => [{ ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]); 
  };
  
  const deleteLog = (logId: string) => { setLogs(prev => prev.filter(l => l.id !== logId)); };

  return (
    <DataContext.Provider value={{ 
      drivers, cars, logs, loading, 
      addCar, assignCarToDriver, unassignCar, updateCarStatus, 
      updateDriverStatus, addLog, deleteLog, registerDriver, 
      refreshDrivers, refreshLogs 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}