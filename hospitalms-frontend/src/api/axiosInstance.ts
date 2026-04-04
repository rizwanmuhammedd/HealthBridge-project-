import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL  = 'http://localhost:5000';
const TOKEN_KEY = 'hms_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('hms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  login:    (email: string, password: string)  => api.post('/api/auth/login', { email, password }),
  register: (data: object)                      => api.post('/api/auth/register', data),
  getUsers: ()                                  => api.get('/api/auth/users'),
};

export const appointmentApi = {
  getMy:       ()              => api.get('/api/appointments/my'),
  getAll:      ()              => api.get('/api/appointments'),
  getByDoctor: (id: number)    => api.get(`/api/appointments/doctor/${id}`),
  book:        (data: object)  => api.post('/api/appointments', data),
  update:      (id: number, data: object) => api.put(`/api/appointments/${id}`, data),
  cancel:      (id: number)    => api.delete(`/api/appointments/${id}/cancel`),
};

export const admissionApi = {
  getAll:    ()                           => api.get('/api/admissions'),
  admit:     (data: object)               => api.post('/api/admissions', data),
  discharge: (id: number, data: object)   => api.put(`/api/admissions/${id}/discharge`, data),
};

export const labApi = {
  getPending:    ()                        => api.get('/api/lab/pending'),
  getByPatient:  (patientId: number)       => api.get(`/api/lab/patient/${patientId}`),
  orderTest:     (data: object)            => api.post('/api/lab', data),
  uploadResult:  (id: number, data: object)=> api.patch(`/api/lab/${id}/result`, data),
};

export const medicineApi = {
  getAll:      ()                          => api.get('/api/medicines'),
  getLowStock: ()                          => api.get('/api/medicines/low-stock'),
  add:         (data: object)              => api.post('/api/medicines', data),
  updateStock: (id: number, qty: number)   => api.patch(`/api/medicines/${id}/stock`, qty),
};

export const prescriptionApi = {
  create:   (data: object)   => api.post('/api/prescriptions', data),
  dispense: (id: number)     => api.post(`/api/prescriptions/${id}/dispense`),
  getAll:   ()               => api.get('/api/prescriptions'),
};

export const billApi = {
  create:  (data: object)               => api.post('/api/bills', data),
  pay:     (id: number, data: object)   => api.post(`/api/bills/${id}/payment`, data),
  getByPatient: (patientId: number)     => api.get(`/api/bills/patient/${patientId}`),
};

export const notificationApi = {
  getMy:        ()         => api.get('/api/notifications'),
  getUnread:    ()         => api.get('/api/notifications/unread-count'),
  markRead:     (id: number) => api.patch(`/api/notifications/${id}/read`),
  markAllRead:  ()         => api.patch('/api/notifications/read-all'),
};
