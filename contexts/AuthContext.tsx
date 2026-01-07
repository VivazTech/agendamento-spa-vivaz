import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

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
  const hasProcessedRedirect = useRef<boolean>(false);

  useEffect(() => {
    // Verificar se há resultado de redirect do Firebase
    const checkAuth = async () => {
      // IMPORTANTE: Manter isLoading = true até processar tudo
      setIsLoading(true);
      
      try {
        const { checkRedirectResult, onAuthStateChange } = await import('../src/lib/firebaseClient');
        
        // Primeiro, verificar redirect result
        const redirectResult = await checkRedirectResult();
        
        if (redirectResult) {
          // Se há resultado de redirect, processar login
          console.log('[AuthContext] Processando redirect result...');
          await processLogin(redirectResult.idToken);
          return;
        }
        
        // Se não há redirect result, verificar se há usuário autenticado no Firebase
        // Aguardar um pouco para ver se o Firebase atualiza o estado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { auth } = await import('../src/lib/firebaseClient');
        if (auth.currentUser && !hasProcessedRedirect.current) {
          console.log('[AuthContext] currentUser encontrado após aguardar, processando login...');
          try {
            const idToken = await auth.currentUser.getIdToken();
            await processLogin(idToken);
            return;
          } catch (error) {
            console.error('[AuthContext] Erro ao obter idToken do currentUser:', error);
          }
        }
        
        // Também configurar listener para mudanças futuras
        const { onAuthStateChange } = await import('../src/lib/firebaseClient');
        onAuthStateChange(async (firebaseUser) => {
          if (firebaseUser && !hasProcessedRedirect.current) {
            console.log('[AuthContext] Usuário autenticado no Firebase detectado via onAuthStateChange');
            try {
              const idToken = await firebaseUser.getIdToken();
              await processLogin(idToken);
            } catch (error) {
              console.error('[AuthContext] Erro ao obter idToken do Firebase user:', error);
            }
          }
        });
        
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
          console.log('[AuthContext] Sessão restaurada do localStorage');
        } catch (e) {
          // Se houver erro ao parsear, limpar dados inválidos
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_data');
        }
      }
      
      setIsLoading(false);
    };

    // Função auxiliar para processar login
    const processLogin = async (idToken: string) => {
      try {
        const res = await fetch('/api/auth-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          console.log('[AuthContext] Resposta do backend:', { ok: data.ok, hasAdmin: !!data.admin, error: data.error });
          
          if (data.ok && data.admin) {
            setIsAuthenticated(true);
            setAdmin(data.admin);
            localStorage.setItem('admin_authenticated', 'true');
            localStorage.setItem('admin_data', JSON.stringify(data.admin));
            console.log('[AuthContext] Login via redirect successful');
            hasProcessedRedirect.current = true;
            
            // Aguardar um pouco para garantir que o estado foi atualizado
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Redirecionar para /admin após login bem-sucedido
            const currentPath = window.location.pathname;
            console.log('[AuthContext] Path atual:', currentPath);
            
            if (currentPath !== '/admin') {
              console.log('[AuthContext] Redirecionando para /admin após login bem-sucedido');
              window.location.replace('/admin');
              return; // Não definir isLoading = false aqui, pois a página será redirecionada
            } else {
              console.log('[AuthContext] Já estamos em /admin, não precisa redirecionar');
            }
            
            setIsLoading(false);
            return;
          } else {
            console.error('[AuthContext] Login falhou:', data.error);
          }
        } else {
          console.error('[AuthContext] Resposta não é JSON');
        }
      } catch (error) {
        console.error('[AuthContext] Erro ao processar login:', error);
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

