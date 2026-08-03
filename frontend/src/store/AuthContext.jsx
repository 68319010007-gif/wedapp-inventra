import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('inventra_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await api.get('/auth/me');
    const u = res.data.data;
    localStorage.setItem('inventra_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('inventra_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch(() => {
        localStorage.removeItem('inventra_token');
        localStorage.removeItem('inventra_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('inventra_token', token);
    localStorage.setItem('inventra_user', JSON.stringify(u));
    setUser(u);
    window.location.href = '/admin';
    return u;
  };

  const logout = () => {
    localStorage.removeItem('inventra_token');
    localStorage.removeItem('inventra_user');
    setUser(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
