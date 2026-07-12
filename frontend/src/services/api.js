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

export default api;
