import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

export interface Driver { 
  id: string; full_name: string; phone: string; email: string; role: 'driver' | 'moderator'; 
  is_active: boolean; assigned_car_id: string | null; 
}
export interface Car { 
  id: string; make: string; model: string; year: number; plate_number: string; 
  color: string | null; vin: string | null; status: 'active' | 'maintenance' | 'retired'; 
  assigned_driver_id: string | null; insurance_expiry: string | null; 
  tech_inspection_expiry: string | null; medical_inspection_expiry: string | null; 
  driver_name?: string | null; created_at: string; 
}
export interface Log { 
  id: string; driver_id: string; date: string; start_time: string; end_time: string; 
  revenue: number; trips_count: number; had_accident: boolean; notes: string; created_at: string; 
}

interface DataContextType {
  drivers: Driver[]; cars: Car[]; logs: Log[]; loading: boolean;
  addCar: (car: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>) => Promise<void>;
  assignCarToDriver: (driverId: string, carId: string) => Promise<void>;
  unassignCar: (carId: string) => Promise<void>;
  updateCarStatus: (carId: string, status: Car['status']) => Promise<void>;
  
  // 🔥 Обновлено: Теперь реально сохраняет в БД
  updateDriverStatus: (driverId: string, isActive: boolean) => Promise<void>;
  
  // 🔥 Новое: Полное редактирование
  updateDriverProfile: (driverId: string, data: { full_name: string; phone: string; email: string }) => Promise<void>;
  
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => void;
  deleteLog: (logId: string) => void;
  registerDriver: (profile: Omit<Driver, 'assigned_car_id'>) => void;
  refreshDrivers: () => Promise<void>;
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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [backendCars, backendDrivers] = await Promise.all([api.cars.getAll(), api.drivers.getAll()]);
        if (backendCars && !('error' in backendCars)) setCars(backendCars);
        if (backendDrivers && !('error' in backendDrivers)) setDrivers(backendDrivers);
      } catch (e) { console.warn('API init failed', e); } finally { setLoading(false); }
    };
    init();
  }, []);

  const refreshDrivers = async () => {
    const updated = await api.drivers.getAll();
    if (updated && !('error' in updated)) setDrivers(updated);
  };

  const refreshCars = async () => {
    const updated = await api.cars.getAll();
    if (updated && !('error' in updated)) setCars(updated);
  };

  // --- Actions ---

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

  // 🔥 Исправлено: теперь отправляет запрос в БД
  const updateDriverStatus = async (driverId: string, isActive: boolean) => {
    // Находим текущее состояние водителя, чтобы сохранить имя и email
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const res = await api.drivers.update(driverId, {
      full_name: driver.full_name,
      phone: driver.phone,
      email: driver.email,
      is_active: isActive
    });

    if ('error' in res) throw new Error(res.error);
    await refreshDrivers(); // Обновляем список, чтобы отобразить изменения
  };

  // 🔥 Новое: редактирование текстовых полей
  const updateDriverProfile = async (driverId: string, data: { full_name: string; phone: string; email: string }) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    const res = await api.drivers.update(driverId, {
      ...data,
      is_active: driver.is_active // Сохраняем текущий статус
    });

    if ('error' in res) throw new Error(res.error);
    await refreshDrivers();
  };

  const addLog = (log: Omit<Log, 'id' | 'created_at'>) => { 
    setLogs(prev => [{ ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]); 
  };
  
  const deleteLog = (logId: string) => { setLogs(prev => prev.filter(l => l.id !== logId)); };
  const registerDriver = () => { refreshDrivers(); };

  return (
    <DataContext.Provider value={{ 
      drivers, cars, logs, loading, 
      addCar, assignCarToDriver, unassignCar, updateCarStatus, 
      updateDriverStatus, updateDriverProfile, addLog, deleteLog, registerDriver, 
      refreshDrivers 
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