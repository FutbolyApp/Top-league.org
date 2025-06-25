import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: false,
});

export const apiRequest = async (method, url, data = null, token = null) => {
  const config = {
    method,
    url,
    headers: {},
  };
  if (data) config.data = data;
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return instance(config).then(res => res.data);
};

export default instance; 