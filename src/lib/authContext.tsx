import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, Branch } from '../types/erp';
import { INITIAL_DEMO_USERS, INITIAL_BRANCHES } from './seedData';

interface AuthContextType {
  currentUser: UserProfile;
  activeBranch: Branch;
  allDemoUsers: UserProfile[];
  allBranches: Branch[];
  switchUser: (userId: string) => void;
  switchBranch: (branchId: string) => void;
  // Role permission helpers
  isSuperAdmin: boolean;
  canEditParts: boolean;
  canPerformStockMovements: boolean;
  canAdjustStockDirectly: boolean;
  canViewFinancials: boolean;
  canManageWarehouseLocations: boolean;
  canAccessAuditLogs: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ahl_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_DEMO_USERS[0];
  });

  const [activeBranch, setActiveBranch] = useState<Branch>(() => {
    const saved = localStorage.getItem('ahl_active_branch');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_BRANCHES[0];
  });

  const switchUser = (userId: string) => {
    const found = INITIAL_DEMO_USERS.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('ahl_active_user', JSON.stringify(found));
    }
  };

  const switchBranch = (branchId: string) => {
    const found = INITIAL_BRANCHES.find(b => b.id === branchId);
    if (found) {
      setActiveBranch(found);
      localStorage.setItem('ahl_active_branch', JSON.stringify(found));
    }
  };

  const role = currentUser.role;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const canEditParts = ['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE', 'PURCHASING'].includes(role);
  const canPerformStockMovements = ['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE', 'PURCHASING', 'SALES'].includes(role);
  const canAdjustStockDirectly = ['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE'].includes(role);
  const canViewFinancials = ['SUPER_ADMIN', 'MANAGER', 'PURCHASING', 'ACCOUNTING'].includes(role);
  const canManageWarehouseLocations = ['SUPER_ADMIN', 'MANAGER', 'WAREHOUSE'].includes(role);
  const canAccessAuditLogs = ['SUPER_ADMIN', 'MANAGER'].includes(role);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeBranch,
        allDemoUsers: INITIAL_DEMO_USERS,
        allBranches: INITIAL_BRANCHES,
        switchUser,
        switchBranch,
        isSuperAdmin,
        canEditParts,
        canPerformStockMovements,
        canAdjustStockDirectly,
        canViewFinancials,
        canManageWarehouseLocations,
        canAccessAuditLogs
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
