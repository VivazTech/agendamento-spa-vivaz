import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  username: string;
  name: string;
  email?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Verificar se há sessão salva no localStorage
    const savedAuth = localStorage.getItem('admin_authenticated');
    const savedAdmin = localStorage.getItem('admin_data');
    
    if (savedAuth === 'true' && savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setIsAuthenticated(true);
        setAdmin(adminData);
      } catch (e) {
        // Se houver erro ao parsear, limpar dados inválidos
        localStorage.removeItem('admin_authenticated');
        localStorage.removeItem('admin_data');
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Attempting Google login');
      const { signInWithGoogleAndGetIdToken } = await import('../src/lib/firebaseClient');
      const { idToken } = await signInWithGoogleAndGetIdToken();

      const res = await fetch('/api/auth-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        console.error('[AuthContext] Non-JSON response from /api/auth-firebase:', { status: res.status, preview: text?.slice(0, 300) });
        return false;
      }

      const data = await res.json();
      if (data.ok && data.admin) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_data', JSON.stringify(data.admin));
        console.log('[AuthContext] Google login successful');
        return true;
      }

      console.log('[AuthContext] Google login failed:', data.error || 'Unknown error');
      return false;
    } catch (error) {
      console.error('[AuthContext] Error during Google login:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdmin(null);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_data');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, loginWithGoogle, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

