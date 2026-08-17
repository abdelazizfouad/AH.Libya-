import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { 
  PartMaster, 
  WarehouseLocation, 
  InventoryItem, 
  StockMovement, 
  EpcCategory, 
  Branch, 
  Warehouse, 
  AuditLog 
} from './types/erp';
import { 
  subscribeParts, 
  subscribeInventory, 
  subscribeStockMovements, 
  subscribeLocations, 
  subscribeCategories, 
  subscribeBranches, 
  subscribeWarehouses, 
  subscribeAuditLogs,
  ensureDatabaseSeeded 
} from './lib/firestoreService';
import {
  INITIAL_PARTS,
  INITIAL_INVENTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_LOCATIONS,
  INITIAL_EPC_CATEGORIES,
  INITIAL_BRANCHES,
  INITIAL_WAREHOUSES
} from './lib/seedData';

import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { BarcodeQrScannerModal } from './components/scanner/BarcodeQrScannerModal';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { PartsMasterView } from './components/parts/PartsMasterView';
import { PartDetailModal } from './components/parts/PartDetailModal';
import { AddEditPartModal } from './components/parts/AddEditPartModal';
import { InventoryLocationsView } from './components/inventory/InventoryLocationsView';
import { StockMovementModal } from './components/inventory/StockMovementModal';
import { MovementsLedgerView } from './components/inventory/MovementsLedgerView';
import { WarehouseManagementView } from './components/warehouse/WarehouseManagementView';
import { BranchesManagementView } from './components/branches/BranchesManagementView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { EpcSetupView } from './components/system/EpcSetupView';

function ErpAppContent() {
  const { activeBranch } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Firestore Live State (Pre-populated with rich Mercedes-Benz catalog for instant load)
  const [parts, setParts] = useState<PartMaster[]>(INITIAL_PARTS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [locations, setLocations] = useState<WarehouseLocation[]>(INITIAL_LOCATIONS);
  const [categories, setCategories] = useState<EpcCategory[]>(INITIAL_EPC_CATEGORIES);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [selectedPartForDetail, setSelectedPartForDetail] = useState<PartMaster | null>(null);
  const [partToEdit, setPartToEdit] = useState<PartMaster | null>(null);
  const [isAddEditPartOpen, setIsAddEditPartOpen] = useState<boolean>(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState<boolean>(false);
  const [movementTargetPart, setMovementTargetPart] = useState<PartMaster | null>(null);

  // Background check & auto-seed Firestore
  useEffect(() => {
    ensureDatabaseSeeded().catch((err) => {
      console.warn('Background database initialization status:', err);
    });
  }, []);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubParts = subscribeParts(setParts);
    const unsubInv = subscribeInventory(setInventory);
    const unsubMov = subscribeStockMovements(setMovements);
    const unsubLoc = subscribeLocations(setLocations);
    const unsubCat = subscribeCategories(setCategories);
    const unsubBr = subscribeBranches(setBranches);
    const unsubWh = subscribeWarehouses(setWarehouses);
    const unsubLog = subscribeAuditLogs(setAuditLogs);

    return () => {
      unsubParts();
      unsubInv();
      unsubMov();
      unsubLoc();
      unsubCat();
      unsubBr();
      unsubWh();
      unsubLog();
    };
  }, []);

  // Keyboard shortcut for Global Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleSelectPart = useCallback((part: PartMaster) => {
    setSelectedPartForDetail(part);
  }, []);

  const handleOpenAddPart = useCallback(() => {
    setPartToEdit(null);
    setIsAddEditPartOpen(true);
  }, []);

  const handleOpenEditPart = useCallback((part: PartMaster) => {
    setPartToEdit(part);
    setIsAddEditPartOpen(true);
  }, []);

  const handleOpenMovement = useCallback((part?: PartMaster) => {
    setMovementTargetPart(part || null);
    setIsMovementModalOpen(true);
  }, []);

  // Calculate Low Stock Count
  const lowStockCount = parts.filter(p => p.totalStock <= p.minStock).length;

  const normalizedView = currentView.toLowerCase();

  return (
    <div className="min-h-screen bg-[#050505] text-[#D4D4D8] flex flex-col antialiased selection:bg-white selection:text-black" dir="rtl">
      
      {/* Top Application Header */}
      <Header
        onOpenGlobalSearch={() => setIsSearchOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddPart={handleOpenAddPart}
        activeView={currentView}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Right ERP Sidebar (RTL) */}
        <Sidebar
          currentView={currentView as any}
          onNavigate={(v) => setCurrentView(v.toLowerCase())}
          lowStockCount={lowStockCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050505] relative">
          {/* Subtle ambient light gradient background */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-white/[0.02] pointer-events-none" />
          
          <div className="relative z-10">
            {normalizedView === 'dashboard' && (
              <DashboardOverview
                parts={parts}
                inventory={inventory}
                movements={movements}
                locations={locations}
                onSelectPart={handleSelectPart}
                onOpenAddPart={handleOpenAddPart}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenMovementModal={() => handleOpenMovement()}
                onNavigateToParts={() => setCurrentView('parts')}
                onNavigateToLocations={() => setCurrentView('inventory')}
                onNavigateToMovements={() => setCurrentView('movements')}
                onNavigateToInventory={() => setCurrentView('inventory')}
              />
            )}

            {normalizedView === 'parts' && (
              <PartsMasterView
                parts={parts}
                inventory={inventory}
                locations={locations}
                onSelectPart={handleSelectPart}
                onOpenAddPart={handleOpenAddPart}
                onOpenEditPart={handleOpenEditPart}
                onOpenMovementModal={(p) => handleOpenMovement(p)}
              />
            )}

            {(normalizedView === 'inventory' || normalizedView === 'locations') && (
              <InventoryLocationsView
                locations={locations}
                inventory={inventory}
                parts={parts}
                warehouses={warehouses}
                branches={branches}
                onSelectPart={handleSelectPart}
                onOpenMovementModal={(p) => handleOpenMovement(p)}
              />
            )}

            {normalizedView === 'movements' && (
              <MovementsLedgerView
                movements={movements}
                onOpenMovementModal={() => handleOpenMovement()}
              />
            )}

            {normalizedView === 'warehouses' && (
              <WarehouseManagementView
                warehouses={warehouses}
                locations={locations}
                inventory={inventory}
              />
            )}

            {normalizedView === 'branches' && (
              <BranchesManagementView
                branches={branches}
              />
            )}

            {(normalizedView === 'audit' || normalizedView === 'audit_logs') && (
              <AuditLogsView
                logs={auditLogs}
              />
            )}

            {(normalizedView === 'system' || normalizedView === 'epc_setup') && (
              <EpcSetupView
                categories={categories}
                parts={parts}
                locations={locations}
                branches={branches}
                onRefreshData={() => {
                  // Refreshed state handled via snapshot listeners
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      
      {/* 1. Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        parts={parts}
        locations={locations}
        onSelectPart={(part) => {
          setSelectedPartForDetail(part);
          setIsSearchOpen(false);
        }}
        onSelectLocation={(loc) => {
          setCurrentView('inventory');
          setIsSearchOpen(false);
        }}
      />

      {/* 2. Barcode & QR Scanner Modal */}
      <BarcodeQrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        parts={parts}
        locations={locations}
        inventory={inventory}
        onSelectPart={(part) => {
          setSelectedPartForDetail(part);
          setIsScannerOpen(false);
        }}
        onSelectLocation={(loc) => {
          setCurrentView('inventory');
          setIsScannerOpen(false);
        }}
      />

      {/* 3. Part Detail Modal */}
      <PartDetailModal
        part={selectedPartForDetail}
        onClose={() => setSelectedPartForDetail(null)}
        inventory={inventory}
        movements={movements}
        allLocations={locations}
        onOpenEditPart={(part) => {
          setSelectedPartForDetail(null);
          handleOpenEditPart(part);
        }}
        onOpenMovementModal={(part) => {
          setSelectedPartForDetail(null);
          handleOpenMovement(part);
        }}
      />

      {/* 4. Add / Edit Part Modal */}
      <AddEditPartModal
        isOpen={isAddEditPartOpen}
        onClose={() => setIsAddEditPartOpen(false)}
        partToEdit={partToEdit}
        categories={categories}
        locations={locations}
        warehouses={warehouses}
        branches={branches}
        onSuccess={(partId) => {
          const savedPart = parts.find(p => p.id === partId);
          if (savedPart) setSelectedPartForDetail(savedPart);
        }}
      />

      {/* 5. Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        parts={parts}
        locations={locations}
        warehouses={warehouses}
        branches={branches}
        preselectedPart={movementTargetPart}
        onSuccess={() => {
          // Live Firestore updates automatically
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErpAppContent />
    </AuthProvider>
  );
}
