import axios from 'axios';
import keycloak from '../keycloak';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
});

api.interceptors.request.use(config => {
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && keycloak.authenticated) {
      await keycloak.updateToken(30);
      err.config.headers.Authorization = `Bearer ${keycloak.token}`;
      return api.request(err.config);
    }
    return Promise.reject(err);
  }
);

export const getMakes         = ()          => api.get('/api/v1/makes');
export const getModels        = (makeId)    => api.get(`/api/v1/makes/${makeId}/models`);
export const getEngines       = (modelId)   => api.get(`/api/v1/models/${modelId}/engines`);
export const getMe            = ()          => api.get('/api/v1/me');
export const getVehicles      = ()          => api.get('/api/v1/vehicles');
export const createVehicle    = (vehicle)   => api.post('/api/v1/vehicles', vehicle);
export const updateVehicle    = (id, patch) => api.patch(`/api/v1/vehicles/${id}`, patch);
export const deleteVehicle    = (id)        => api.delete(`/api/v1/vehicles/${id}`);

export default api;
