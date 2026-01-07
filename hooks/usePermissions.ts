import { useAuth } from '../contexts/AuthContext';

type Role = 'admin' | 'gerente' | 'colaborador';

interface Permissions {
  // Gerenciamento de usuários
  canManageUsers: boolean;
  
  // Gerenciamento de serviços, profissionais, categorias
  canManageServices: boolean;
  canManageProfessionals: boolean;
  canManageCategories: boolean;
  
  // Gerenciamento de agendamentos
  canManageBookings: boolean;
  canEditBookingStatus: boolean;
  
  // Relatórios
  canViewReports: boolean;
  
  // Configurações
  canManageBanners: boolean;
  
  // Informações do usuário
  userRole: Role | null;
  isAdmin: boolean;
  isGerente: boolean;
  isColaborador: boolean;
}

export const usePermissions = (): Permissions => {
  const { admin } = useAuth();
  const role = (admin?.role || 'colaborador') as Role;

  return {
    // Gerenciamento de usuários - apenas admin
    canManageUsers: role === 'admin',
    
    // Gerenciamento de serviços - admin e gerente
    canManageServices: ['admin', 'gerente'].includes(role),
    canManageProfessionals: ['admin', 'gerente'].includes(role),
    canManageCategories: ['admin', 'gerente'].includes(role),
    
    // Gerenciamento de agendamentos - todos podem gerenciar
    canManageBookings: ['admin', 'gerente', 'colaborador'].includes(role),
    canEditBookingStatus: ['admin', 'gerente', 'colaborador'].includes(role),
    
    // Relatórios - apenas admin e gerente
    canViewReports: ['admin', 'gerente'].includes(role),
    
    // Configurações - apenas admin e gerente
    canManageBanners: ['admin', 'gerente'].includes(role),
    
    // Informações do usuário
    userRole: role,
    isAdmin: role === 'admin',
    isGerente: role === 'gerente',
    isColaborador: role === 'colaborador',
  };
};

