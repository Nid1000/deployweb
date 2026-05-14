"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configuración de axios:
// Para evitar problemas con uploads (multipart) pasando por el proxy/rewrite de Next,
// apuntamos directo al backend. CORS ya está habilitado en Laravel.
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const AuthContext = createContext();

const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const escaped = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const getInitialToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || getCookie('token');
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getInitialToken);

  // Configurar axios con el token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (typeof window !== 'undefined') {
        if (!localStorage.getItem('token')) {
          localStorage.setItem('token', token);
        }
        if (!getCookie('token')) {
          const maxAgeDays = 7;
          document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * maxAgeDays}`;
        }
      }
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Interceptor global para manejar 401/403 y forzar cierre de sesión seguro
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const url = error?.config?.url || '';

        if (status === 401 || status === 403) {
          // Cerrar sesión y redirigir según el contexto
          logout();
          if (typeof window !== 'undefined') {
            const isAdminRequest =
              url.includes('/usuarios/admin') ||
              url.includes('/categorias/admin') ||
              url.includes('/productos/admin') ||
              url.includes('/admin/') ||
              window.location.pathname.startsWith('/admin');

            window.location.href = isAdminRequest ? '/admin/login' : '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(resInterceptor);
    };
  }, [token]);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/verify');
          if (response.data?.tipo === 'admin' && response.data.admin) {
            setUser({ ...response.data.admin, tipo: 'admin', activo: true });
          } else if (response.data?.tipo === 'usuario' && response.data.user) {
            setUser({ ...response.data.user, tipo: 'usuario', activo: true });
          } else {
            // Respuesta inesperada, cerrar sesión por seguridad
            logout();
          }
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password, isAdmin = false) => {
    try {
      const endpoint = isAdmin ? '/api/auth/admin/login' : '/api/auth/login';
      const response = await axios.post(endpoint, {
        email,
        password
      });

      const { token: newToken } = response.data || {};
      if (!newToken) {
        const message = response.data?.message || response.data?.error || 'Error al iniciar sesión';
        return { success: false, error: message };
      }
      const userData = isAdmin ? response.data.admin : response.data.user;
      const normalizedUser = isAdmin
        ? { ...userData, tipo: 'admin', activo: true }
        : { ...userData, tipo: 'usuario', activo: true };
      
      setToken(newToken);
      setUser(normalizedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        // Set cookie para middleware (no HttpOnly). Recomendado migrar a cookie HttpOnly desde backend.
        const maxAgeDays = 7;
        document.cookie = `token=${newToken}; path=/; max-age=${60 * 60 * 24 * maxAgeDays}`;
      }
      
      return { success: true, user: normalizedUser };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.mensaje ||
        (!error?.response ? `No se pudo conectar con el backend (${axios.defaults.baseURL}).` : null) ||
        'Error al iniciar sesión';
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      const { token: newToken, user: newUser } = response.data || {};
      if (!newToken) {
        const message = response.data?.message || response.data?.error || 'Error al registrarse';
        return { success: false, error: message };
      }
      
      setToken(newToken);
      setUser(newUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', newToken);
        const maxAgeDays = 7;
        document.cookie = `token=${newToken}; path=/; max-age=${60 * 60 * 24 * maxAgeDays}`;
      }
      
      return { success: true, user: newUser };
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.details) ? data.details[0]?.msg : undefined) ||
        'Error al registrarse';
      const details = Array.isArray(data?.details) ? data.details : undefined;
      return { success: false, error: message, details };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Eliminar cookie del token
      document.cookie = 'token=; path=/; max-age=0';
    }
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const isAdmin = () => {
    return user?.tipo === 'admin' && user?.activo;
  };

  const isUser = () => {
    return user?.tipo === 'usuario' && user?.activo;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    isAdmin,
    isUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
