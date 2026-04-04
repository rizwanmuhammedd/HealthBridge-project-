import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export type Role = 'Patient' | 'Doctor' | 'Admin' | 'Pharmacist' | 'LabTechnician' | 'Receptionist';

export interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BASE_URL = 'http://localhost:5000';
const TOKEN_KEY = 'hms_token';
const USER_KEY  = 'hms_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        const parsed: AuthUser = JSON.parse(stored);
        const payload = JSON.parse(atob(parsed.token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser(parsed);
        } else {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
    const data = response.data as AuthUser;
    setUser(data);
    localStorage.setItem(USER_KEY,  JSON.stringify(data));
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await axios.post(`${BASE_URL}/api/auth/register`, data);
    await login(data.email, data.password);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
