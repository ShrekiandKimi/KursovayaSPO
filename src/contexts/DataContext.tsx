import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

// --- Типы данных ---
export interface Driver {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'driver' | 'moderator';
  is_active: boolean;
  assigned_car_id: string | null;
}

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string;
  color: string | null;
  vin: string | null;
  status: 'active' | 'maintenance' | 'retired';
  assigned_driver_id: string | null;
  insurance_expiry: string | null;
  tech_inspection_expiry: string | null;
  medical_inspection_expiry: string | null;  // ✅ Новое поле для медосмотра
  driver_name?: string | null;
  created_at: string;
}

export interface Log {
  id: string;
  driver_id: string;
  date: string;
  start_time: string;
  end_time: string;
  revenue: number;
  trips_count: number;
  had_accident: boolean;
  notes: string;
  created_at: string;
}

// --- Интерфейс контекста ---
interface DataContextType {
  drivers: Driver[];
  cars: Car[];
  logs: Log[];
  loading: boolean;
  
  // Методы для автомобилей (через API)
  addCar: (car: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>) => Promise<void>;
  assignCarToDriver: (driverId: string, carId: string) => Promise<void>;
  unassignCar: (carId: string) => Promise<void>;
  updateCarStatus: (carId: string, status: Car['status']) => Promise<void>;
  
  // Методы для локальных данных
  updateDriverStatus: (driverId: string, isActive: boolean) => void;
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => void;
  deleteLog: (logId: string) => void;
  registerDriver: (profile: Omit<Driver, 'assigned_car_id'>) => void;
  refreshDrivers: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);
const LOGS_KEY = 'tp_logs';

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  // Инициализация состояния
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [logs, setLogs] = useState<Log[]>(() => load(LOGS_KEY, []));
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных при старте
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [backendCars, backendDrivers] = await Promise.all([
          api.cars.getAll(),
          api.drivers.getAll(),
        ]);
        
        if (backendCars && !('error' in backendCars)) setCars(backendCars);
        if (backendDrivers && !('error' in backendDrivers)) setDrivers(backendDrivers);
      } catch (e) {
        console.warn('API init failed, using fallback', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Сохранение логов локально
  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); }, [logs]);

  // --- Функции обновления ---

  const refreshCars = async () => {
    console.log('🔄 Refreshing cars from API...');
    try {
      const updated = await api.cars.getAll();
      console.log('✅ API response:', updated);
      
      if (updated && !('error' in updated)) {
        console.log(`🚗 Loaded ${updated.length} cars`);
        setCars(updated);
      } else {
        console.error('❌ API returned error:', updated);
      }
    } catch (e) {
      console.error('❌ Failed to refresh cars:', e);
    }
  };

  const refreshDrivers = async () => {
    try {
      const updated = await api.drivers.getAll();
      if (updated && !('error' in updated)) setDrivers(updated);
    } catch (e) { console.error('Failed to refresh drivers', e); }
  };

  // 🚗 Автомобили (через API)
  const addCar = async (car: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>) => {
    try {
      await api.cars.add(car);
      await refreshCars();
    } catch (e) {
      console.error('API addCar failed', e);
      setCars(prev => [{ ...car, id: crypto.randomUUID(), assigned_driver_id: null } as Car, ...prev]);
    }
  };

  const assignCarToDriver = async (driverId: string, carId: string) => {
    try {
      await api.cars.assign(carId, driverId);
      await refreshCars();
      await refreshDrivers();
    } catch (e) {
      console.error('API assign failed', e);
      setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: driverId } : c));
    }
  };

  const unassignCar = async (carId: string) => {
    try {
      await api.cars.unassign(carId);
      await refreshCars();
      await refreshDrivers();
    } catch (e) {
      console.error('API unassign failed', e);
      setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: null } : c));
    }
  };

  const updateCarStatus = async (carId: string, status: Car['status']) => {
    try {
      await api.cars.updateStatus(carId, status);
      await refreshCars();
    } catch (e) {
      console.error('API status update failed', e);
      setCars(prev => prev.map(c => c.id === carId ? { ...c, status } : c));
    }
  };

  // 👤 Водители (локальные действия + обновление из БД)
  const updateDriverStatus = (driverId: string, isActive: boolean) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, is_active: isActive } : d));
  };

  const registerDriver = (profile: Omit<Driver, 'assigned_car_id'>) => {
    refreshDrivers();
  };

  // 📝 Логи (пока локально)
  const addLog = (log: Omit<Log, 'id' | 'created_at'>) => {
    setLogs(prev => [{ ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]);
  };

  const deleteLog = (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  return (
    <DataContext.Provider value={{
      drivers, cars, logs, loading,
      addCar, assignCarToDriver, unassignCar, updateCarStatus,
      updateDriverStatus, addLog, deleteLog, registerDriver, refreshDrivers
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