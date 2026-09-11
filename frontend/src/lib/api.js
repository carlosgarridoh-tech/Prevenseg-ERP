import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('prevenseg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el token de acceso venció (dura 1 hora), lo renueva solo con el refresh token
// y reintenta la petición, en vez de dejar la pantalla sin datos.
let renovando = null;

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._reintentado) {
      return Promise.reject(error);
    }
    original._reintentado = true;

    const refreshToken = localStorage.getItem('prevenseg_refresh');
    if (!refreshToken) {
      localStorage.removeItem('prevenseg_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      if (!renovando) {
        renovando = axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh`, { refreshToken });
      }
      const { data } = await renovando;
      renovando = null;
      localStorage.setItem('prevenseg_token', data.token);
      localStorage.setItem('prevenseg_refresh', data.refreshToken);
      original.headers.Authorization = `Bearer ${data.token}`;
      return api(original);
    } catch (e) {
      renovando = null;
      localStorage.removeItem('prevenseg_token');
      localStorage.removeItem('prevenseg_refresh');
      window.location.href = '/login';
      return Promise.reject(error);
    }
  }
);

export default api;
