import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Driver { id: string; full_name: string; phone: string; email: string; role: 'driver' | 'moderator'; is_active: boolean; assigned_car_id: string | null; }
export interface Car { id: string; make: string; model: string; year: number; plate_number: string; color: string; vin: string; status: 'active' | 'maintenance' | 'retired'; assigned_driver_id: string | null; insurance_expiry: string | null; tech_inspection_expiry: string | null; }
export interface Log { id: string; driver_id: string; date: string; start_time: string; end_time: string; revenue: number; trips_count: number; had_accident: boolean; notes: string; created_at: string; }

interface DataContextType {
  drivers: Driver[]; cars: Car[]; logs: Log[];
  addCar: (car: Omit<Car, 'id' | 'assigned_driver_id'>) => void;
  assignCarToDriver: (driverId: string, carId: string) => void;
  unassignCar: (carId: string) => void;
  updateCarStatus: (carId: string, status: Car['status']) => void;
  updateDriverStatus: (driverId: string, isActive: boolean) => void;
  addLog: (log: Omit<Log, 'id' | 'created_at'>) => void;
  deleteLog: (logId: string) => void;
  registerDriver: (profile: Omit<Driver, 'assigned_car_id'>) => void;
}

const DataContext = createContext<DataContextType | null>(null);
const DRIVERS_KEY = 'tp_drivers';
const CARS_KEY = 'tp_cars';
const LOGS_KEY = 'tp_logs';

function load<T>(key: string, fallback: T[]): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') || fallback; } catch { return fallback; }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>(() => load(DRIVERS_KEY, []));
  const [cars, setCars] = useState<Car[]>(() => load(CARS_KEY, []));
  const [logs, setLogs] = useState<Log[]>(() => load(LOGS_KEY, []));

  useEffect(() => { localStorage.setItem(DRIVERS_KEY, JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem(CARS_KEY, JSON.stringify(cars)); }, [cars]);
  useEffect(() => { localStorage.setItem(LOGS_KEY, JSON.stringify(logs)); }, [logs]);

  const addCar = (car: Omit<Car, 'id' | 'assigned_driver_id'>) => setCars(prev => [{ ...car, id: crypto.randomUUID(), assigned_driver_id: null }, ...prev]);
  const assignCarToDriver = (driverId: string, carId: string) => {
    setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: driverId } : c));
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, assigned_car_id: carId } : d));
  };
  const unassignCar = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    setCars(prev => prev.map(c => c.id === carId ? { ...c, assigned_driver_id: null } : c));
    if (car?.assigned_driver_id) setDrivers(prev => prev.map(d => d.id === car.assigned_driver_id ? { ...d, assigned_car_id: null } : d));
  };
  const updateCarStatus = (carId: string, status: Car['status']) => setCars(prev => prev.map(c => c.id === carId ? { ...c, status } : c));
  const updateDriverStatus = (driverId: string, isActive: boolean) => setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, is_active: isActive } : d));
  const addLog = (log: Omit<Log, 'id' | 'created_at'>) => setLogs(prev => [{ ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...prev]);
  const deleteLog = (logId: string) => setLogs(prev => prev.filter(l => l.id !== logId));
  const registerDriver = (profile: Omit<Driver, 'assigned_car_id'>) => setDrivers(prev => prev.some(d => d.email === profile.email) ? prev : [{ ...profile, assigned_car_id: null }, ...prev]);

  return (
    <DataContext.Provider value={{ drivers, cars, logs, addCar, assignCarToDriver, unassignCar, updateCarStatus, updateDriverStatus, addLog, deleteLog, registerDriver }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}