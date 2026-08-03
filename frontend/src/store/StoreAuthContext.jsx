import { createContext, useContext, useEffect, useState } from 'react';
import storeApi from '../services/storeApi';

const StoreAuthContext = createContext(null);

export function StoreAuthProvider({ children }) {
  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inventra_store_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('inventra_store_token');
    if (!token) {
      setLoading(false);
      return;
    }
    storeApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    storeApi
      .get('/store/auth/me')
      .then((res) => setCustomer(res.data.data))
      .catch(() => {
        localStorage.removeItem('inventra_store_token');
        localStorage.removeItem('inventra_store_user');
        delete storeApi.defaults.headers.common.Authorization;
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, c) => {
    localStorage.setItem('inventra_store_token', token);
    localStorage.setItem('inventra_store_user', JSON.stringify(c));
    storeApi.defaults.headers.common.Authorization = `Bearer ${token}`;
    setCustomer(c);
  };

  const login = async (email, password) => {
    const res = await storeApi.post('/store/auth/login', { email, password });
    const { token, customer: c } = res.data.data;
    persist(token, c);
    return c;
  };

  const register = async (data) => {
    const res = await storeApi.post('/store/auth/register', data);
    const { token, customer: c } = res.data.data;
    persist(token, c);
    return c;
  };

  const logout = () => {
    localStorage.removeItem('inventra_store_token');
    localStorage.removeItem('inventra_store_user');
    delete storeApi.defaults.headers.common.Authorization;
    setCustomer(null);
  };

  const updateProfile = async (data) => {
    const res = await storeApi.put('/store/auth/profile', data);
    const c = res.data.data;
    localStorage.setItem('inventra_store_user', JSON.stringify(c));
    setCustomer(c);
    return c;
  };

  const updatePassword = async (currentPassword, newPassword) => {
    await storeApi.put('/store/auth/password', { currentPassword, newPassword });
  };

  return (
    <StoreAuthContext.Provider
      value={{
        customer,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        isAuthenticated: !!customer,
      }}
    >
      {children}
    </StoreAuthContext.Provider>
  );
}

export const useStoreAuth = () => useContext(StoreAuthContext);
