import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Driver {
  id: string; full_name: string; phone: string; email: string;
  role: 'driver' | 'moderator'; is_active: boolean; assigned_car_id: string | null;
}
export interface Car {
  id: string; make: string; model: string; year: number; plate_number: string;
  color: string; vin: string; status: 'active' | 'maintenance' | 'retired'; assigned_driver_id: string | null;
}
export interface DailyLog {
  id: string; driver_id: string; date: string; start_time: string; end_time: string;
  trips_count: number; total_revenue: number; had_accident: boolean; accident_notes?: string; created_at: string;
}

interface DataContextType {
  drivers: Driver[]; cars: Car[]; logs: DailyLog[];
  addCar: (car: Omit<Car, 'id' | 'assigned_driver_id'>) => void;
  assignCarToDriver: (driverId: string, carId: string) => void;
  unassignCar: (carId: string) => void;
  updateCarStatus: (carId: string, status: Car['status']) => void;
  updateDriverStatus: (driverId: string, isActive: boolean) => void;
  addLog: (log: Omit<DailyLog, 'id' | 'created_at'>) => void;
  deleteLog: (logId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);
const KEY_DRIVERS = 'taxopark_drivers';
const KEY_CARS = 'taxopark_cars';
const KEY_LOGS = 'taxopark_logs';

function load<T>(key: string, fallback: T[]): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') || fallback; }
  catch { return fallback; }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>(() => load(KEY_DRIVERS, []));
  const [cars, setCars] = useState<Car[]>(() => load(KEY_CARS, []));
  const [logs, setLogs] = useState<DailyLog[]>(() => load(KEY_LOGS, []));

  useEffect(() => { localStorage.setItem(KEY_DRIVERS, JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem(KEY_CARS, JSON.stringify(cars)); }, [cars]);
  useEffect(() => { localStorage.setItem(KEY_LOGS, JSON.stringify(logs)); }, [logs]);

  const addCar = (car: Omit<Car, 'id' | 'assigned_driver_id'>) => {
    setCars(prev => [{ ...car, id: crypto.randomUUID(), assigned_driver_id: null }, ...prev]);
  };
  const assignCarToDriver = (driverId: string, carId: string) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: driverId } : c));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, assigned_car_id: carId } : d));
  };
  const unassignCar = (carId: string) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: null } : c));
    const car = cars.find(c => c.id === carId);
    if (car?.assigned_driver_id) setDrivers(prev => prev.map(d => d.id === car.assigned_driver_id ? { ...d, assigned_car_id: null } : d));
  };
  const updateCarStatus = (carId: string, status: Car['status']) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, status } : c));
  };
  const updateDriverStatus = (driverId: string, isActive: boolean) => {
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, is_active: isActive } : d));
  };
  const addLog = (log: Omit<DailyLog, 'id' | 'created_at'>) => {
    setLogs(prev => [{ ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]);
  };
  const deleteLog = (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
  };

  return (
    <DataContext.Provider value={{ drivers, cars, logs, addCar, assignCarToDriver, unassignCar, updateCarStatus, updateDriverStatus, addLog, deleteLog }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}