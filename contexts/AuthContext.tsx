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
    // Verificar se há resultado de redirect do Firebase
    const checkAuth = async () => {
      try {
        const { checkRedirectResult } = await import('../src/lib/firebaseClient');
        const redirectResult = await checkRedirectResult();
        
        if (redirectResult) {
          // Se há resultado de redirect, processar login
          console.log('[AuthContext] Processando redirect result...');
          const res = await fetch('/api/auth-firebase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: redirectResult.idToken }),
          });

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.ok && data.admin) {
              setIsAuthenticated(true);
              setAdmin(data.admin);
              localStorage.setItem('admin_authenticated', 'true');
              localStorage.setItem('admin_data', JSON.stringify(data.admin));
              console.log('[AuthContext] Login via redirect successful');
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao verificar redirect:', error);
      }

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
    };

    checkAuth();
  }, []);

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

