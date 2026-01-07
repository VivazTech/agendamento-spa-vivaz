import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

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
        
        // Se não há redirect result, aguardar mais tempo e verificar currentUser
        // O Firebase pode precisar de mais tempo para processar o redirect
        console.log('[AuthContext] Aguardando Firebase processar redirect...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        
        const { auth } = await import('../src/lib/firebaseClient');
        console.log('[AuthContext] Verificando currentUser após aguardar:', auth.currentUser);
        
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
        
        // Configurar listener para mudanças no estado de autenticação
        // Isso é importante porque o Firebase pode atualizar o estado de forma assíncrona
        const { onAuthStateChange: setupAuthListener } = await import('../src/lib/firebaseClient');
        let listenerUnsubscribe: (() => void) | null = null;
        
        // Aguardar até 5 segundos por mudança no estado de autenticação
        const authStatePromise = new Promise<void>((resolve) => {
          let resolved = false;
          
          listenerUnsubscribe = setupAuthListener(async (firebaseUser) => {
            if (firebaseUser && !hasProcessedRedirect.current && !resolved) {
              resolved = true;
              console.log('[AuthContext] Usuário autenticado no Firebase detectado via onAuthStateChange');
              try {
                const idToken = await firebaseUser.getIdToken();
                await processLogin(idToken);
                if (listenerUnsubscribe) listenerUnsubscribe();
                resolve();
              } catch (error) {
                console.error('[AuthContext] Erro ao obter idToken do Firebase user:', error);
                if (listenerUnsubscribe) listenerUnsubscribe();
                resolve();
              }
            } else if (!firebaseUser && !resolved) {
              // Se não há usuário após 5 segundos, continuar
              setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  if (listenerUnsubscribe) listenerUnsubscribe();
                  resolve();
                }
              }, 5000);
            }
          });
        });
        
        // Aguardar o listener ou timeout
        await authStatePromise;
        
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

