// src/lib/api.ts

const API_BASE = "http://localhost:8080/api";

// --- Типы данных ---

export interface ApiError {
  error: string;
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
  driver_name?: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'driver' | 'moderator';
  is_active: boolean;
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

export interface AuthResponse {
  status: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: 'driver' | 'moderator';
  error?: string;
}

// --- Вспомогательная функция для запросов ---

async function request<T>(endpoint: string, options?: RequestInit): Promise<T | ApiError> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || `HTTP ${response.status}` } as ApiError;
    }
    
    return data as T;
  } catch (e) {
    console.error('API request failed:', e);
    return { error: 'Network error' } as ApiError;
  }
}

// --- Экспортируемый API объект ---

export const api = {
  
  // 🚗 Автомобили
  cars: {
    getAll: (): Promise<Car[] | ApiError> => request<Car[]>('/cars'),
    
    add: (data: Omit<Car, 'id' | 'assigned_driver_id' | 'created_at'>): Promise<{ status: string } | ApiError> => 
      request('/cars', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    assign: (carId: string, driverId: string): Promise<{ status: string } | ApiError> => 
      request('/cars/assign', {
        method: 'POST',
        body: JSON.stringify({ car_id: carId, driver_id: driverId }),
      }),
    
    unassign: (carId: string): Promise<{ status: string } | ApiError> => 
      request('/cars/unassign', {
        method: 'POST',
        body: JSON.stringify({ car_id: carId }),
      }),
    
    updateStatus: (carId: string, status: Car['status']): Promise<{ status: string } | ApiError> => 
      request('/cars/status', {
        method: 'POST',
        body: JSON.stringify({ car_id: carId, status }),
      }),
  },

  // 👥 Водители
  drivers: {
    getAll: (): Promise<Driver[] | ApiError> => request<Driver[]>('/drivers'),
    
    // 🔥 НОВОЕ: Обновление профиля водителя
    update: (id: string, data: { full_name: string; phone: string; email: string; is_active: boolean }): Promise<{ status: string } | ApiError> => 
      request('/drivers', {
        method: 'PUT',
        body: JSON.stringify({ id, ...data }),
      }),
  },


  // 📝 Логи (смены, доходы)
  logs: {
    getAll: (driverId?: string): Promise<Log[] | ApiError> => {
      const query = driverId ? `?driver_id=${driverId}` : '';
      return request<Log[]>(`/logs${query}`);
    },
    
    add: (data: Omit<Log, 'id' | 'created_at'>): Promise<{ status: string } | ApiError> => 
      request('/logs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // 🔐 Авторизация
  auth: {
    register: (data: {
      email: string;
      password: string;
      full_name: string;
      phone: string;
      role: 'driver' | 'moderator';
    }): Promise<AuthResponse> => 
      request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    login: (email: string, password: string): Promise<AuthResponse> => 
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  // ❤️ Health check
  ping: (): Promise<{ status: string } | ApiError> => request('/ping'),
};