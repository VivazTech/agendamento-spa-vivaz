import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  username: string;
  name: string;
  email?: string;
  role?: 'admin' | 'gerente' | 'colaborador';
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>; // Mantido para compatibilidade, mas não será usado
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
    const checkAuth = () => {
      setIsLoading(true);
      
      const savedAuth = localStorage.getItem('admin_authenticated');
      const savedAdmin = localStorage.getItem('admin_data');
      
      if (savedAuth === 'true' && savedAdmin) {
        try {
          const adminData = JSON.parse(savedAdmin);
          setIsAuthenticated(true);
          setAdmin(adminData);
          console.log('[AuthContext] Sessão restaurada do localStorage');
        } catch (e) {
          // Se houver erro ao parsear, limpar dados inválidos
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_data');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log('[AuthContext] Iniciando login com username/senha');
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      
      if (data.ok && data.admin) {
        setIsAuthenticated(true);
        setAdmin(data.admin);
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_data', JSON.stringify(data.admin));
        console.log('[AuthContext] Login bem-sucedido');
        return true;
      } else {
        console.error('[AuthContext] Login falhou:', data.error);
        return false;
      }
    } catch (error: any) {
      console.error('[AuthContext] Erro ao fazer login:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      console.log('[AuthContext] Iniciando login com Google via redirect');
      const { signInWithGoogleRedirect } = await import('../src/lib/firebaseClient');
      
      // Iniciar redirect - a página será redirecionada para o Google
      await signInWithGoogleRedirect();
      
      // Se chegou aqui, algo deu errado (não deveria acontecer)
      console.error('[AuthContext] signInWithRedirect não redirecionou a página');
      return false;
    } catch (error: any) {
      console.error('[AuthContext] Error during Google login redirect:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdmin(null);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_data');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, login, loginWithGoogle, logout, isLoading }}>
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

