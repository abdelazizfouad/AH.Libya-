import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  PartMaster, 
  InventoryItem, 
  StockMovement, 
  WarehouseLocation, 
  Branch, 
  Warehouse, 
  EpcCategory, 
  AuditLog, 
  MovementType 
} from '../types/erp';
import { 
  INITIAL_PARTS, 
  INITIAL_INVENTORY, 
  INITIAL_STOCK_MOVEMENTS, 
  INITIAL_LOCATIONS, 
  INITIAL_BRANCHES, 
  INITIAL_WAREHOUSES, 
  INITIAL_EPC_CATEGORIES 
} from './seedData';

// Collection references
const PARTS_COL = 'parts';
const INVENTORY_COL = 'inventory';
const MOVEMENTS_COL = 'stock_movements';
const LOCATIONS_COL = 'locations';
const BRANCHES_COL = 'branches';
const WAREHOUSES_COL = 'warehouses';
const CATEGORIES_COL = 'categories';
const AUDIT_LOGS_COL = 'audit_logs';

/**
 * Check if the database has been seeded; if empty, populate with rich Mercedes ERP seed data.
 */
export async function ensureDatabaseSeeded(): Promise<boolean> {
  try {
    const partsSnapshot = await getDocs(collection(db, PARTS_COL));
    if (!partsSnapshot.empty) {
      return false; // Already populated
    }

    console.log('Seeding initial Mercedes-Benz Spare Parts ERP dataset into Firestore...');
    const batch = writeBatch(db);

    // 1. Branches
    for (const b of INITIAL_BRANCHES) {
      const ref = doc(db, BRANCHES_COL, b.id);
      batch.set(ref, b);
    }

    // 2. Warehouses
    for (const w of INITIAL_WAREHOUSES) {
      const ref = doc(db, WAREHOUSES_COL, w.id);
      batch.set(ref, w);
    }

    // 3. Locations
    for (const loc of INITIAL_LOCATIONS) {
      const ref = doc(db, LOCATIONS_COL, loc.id);
      batch.set(ref, loc);
    }

    // 4. EPC Categories
    for (const cat of INITIAL_EPC_CATEGORIES) {
      const ref = doc(db, CATEGORIES_COL, cat.id);
      batch.set(ref, cat);
    }

    // 5. Parts Master
    for (const p of INITIAL_PARTS) {
      const ref = doc(db, PARTS_COL, p.id);
      batch.set(ref, p);
    }

    // 6. Inventory Items
    for (const inv of INITIAL_INVENTORY) {
      const ref = doc(db, INVENTORY_COL, inv.id);
      batch.set(ref, inv);
    }

    // 7. Stock Movements
    for (const mov of INITIAL_STOCK_MOVEMENTS) {
      const ref = doc(db, MOVEMENTS_COL, mov.id);
      batch.set(ref, mov);
    }

    await batch.commit();
    console.log('Database successfully seeded with realistic Mercedes-Benz ERP records!');
    return true;
  } catch (error) {
    console.error('Error during database seed check:', error);
    return false;
  }
}

/**
 * Force re-seed database with initial clean demo dataset
 */
export async function forceReseedDatabase(): Promise<void> {
  const batch = writeBatch(db);

  for (const b of INITIAL_BRANCHES) {
    batch.set(doc(db, BRANCHES_COL, b.id), b);
  }
  for (const w of INITIAL_WAREHOUSES) {
    batch.set(doc(db, WAREHOUSES_COL, w.id), w);
  }
  for (const loc of INITIAL_LOCATIONS) {
    batch.set(doc(db, LOCATIONS_COL, loc.id), loc);
  }
  for (const cat of INITIAL_EPC_CATEGORIES) {
    batch.set(doc(db, CATEGORIES_COL, cat.id), cat);
  }
  for (const p of INITIAL_PARTS) {
    batch.set(doc(db, PARTS_COL, p.id), p);
  }
  for (const inv of INITIAL_INVENTORY) {
    batch.set(doc(db, INVENTORY_COL, inv.id), inv);
  }
  for (const mov of INITIAL_STOCK_MOVEMENTS) {
    batch.set(doc(db, MOVEMENTS_COL, mov.id), mov);
  }

  await batch.commit();
}

// ----------------------------------------------------
// PARTS MASTER SERVICE
// ----------------------------------------------------

export function subscribeParts(callback: (parts: PartMaster[]) => void) {
  const q = query(collection(db, PARTS_COL));
  return onSnapshot(q, (snapshot) => {
    const parts: PartMaster[] = [];
    snapshot.forEach((d) => {
      parts.push({ id: d.id, ...(d.data() as Omit<PartMaster, 'id'>) });
    });
    // Fallback if empty and not yet seeded
    if (parts.length === 0) {
      callback(INITIAL_PARTS);
    } else {
      callback(parts);
    }
  }, (err) => {
    console.warn('Firestore parts subscription fallback:', err);
    callback(INITIAL_PARTS);
  });
}

export async function createPart(
  partData: Omit<PartMaster, 'id' | 'createdAt' | 'updatedAt' | 'totalStock' | 'availableStock'>,
  initialAllocation?: {
    branchId: string;
    branchName: string;
    warehouseId: string;
    warehouseName: string;
    locationId: string;
    locationCode: string;
    quantity: number;
    user: { id: string; name: string };
  }
): Promise<string> {
  const partId = `part_${partData.partNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
  const now = new Date().toISOString();
  const initQty = initialAllocation ? initialAllocation.quantity : 0;

  const partRecord: PartMaster = {
    ...partData,
    id: partId,
    partNumber: partData.partNumber.trim().toUpperCase(),
    totalStock: initQty,
    availableStock: initQty,
    createdAt: now,
    updatedAt: now
  };

  const batch = writeBatch(db);
  batch.set(doc(db, PARTS_COL, partId), partRecord);

  // If initial inventory allocation was provided
  if (initialAllocation && initialAllocation.quantity > 0) {
    const invId = `inv_${partRecord.partNumber}_${initialAllocation.locationCode.replace(/[^a-zA-Z0-9]/g, '')}`;
    const invRecord: InventoryItem = {
      id: invId,
      partId: partId,
      partNumber: partRecord.partNumber,
      partNameEn: partRecord.nameEn,
      partNameAr: partRecord.nameAr,
      branchId: initialAllocation.branchId,
      branchName: initialAllocation.branchName,
      warehouseId: initialAllocation.warehouseId,
      warehouseName: initialAllocation.warehouseName,
      locationId: initialAllocation.locationId,
      locationCode: initialAllocation.locationCode,
      quantity: initialAllocation.quantity,
      reservedQuantity: 0,
      availableQuantity: initialAllocation.quantity,
      costPrice: partRecord.costPrice,
      sellingPrice: partRecord.sellingPrice,
      lastMovementDate: now,
      updatedAt: now
    };
    batch.set(doc(db, INVENTORY_COL, invId), invRecord);

    // Record Stock Movement
    const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const movRecord: StockMovement = {
      id: movId,
      partId: partId,
      partNumber: partRecord.partNumber,
      partName: partRecord.nameEn,
      movementType: 'INITIAL_STOCK',
      quantity: initialAllocation.quantity,
      previousQuantity: 0,
      newQuantity: initialAllocation.quantity,
      branchId: initialAllocation.branchId,
      branchName: initialAllocation.branchName,
      warehouseId: initialAllocation.warehouseId,
      warehouseName: initialAllocation.warehouseName,
      destinationLocation: initialAllocation.locationCode,
      reference: 'PART-INITIALIZATION',
      reason: 'Part Master registration and initial bin placement',
      userId: initialAllocation.user.id,
      userName: initialAllocation.user.name,
      timestamp: now
    };
    batch.set(doc(db, MOVEMENTS_COL, movId), movRecord);
  }

  // Audit Log
  const auditId = `audit_${Date.now()}`;
  batch.set(doc(db, AUDIT_LOGS_COL, auditId), {
    id: auditId,
    userId: initialAllocation?.user.id || 'system',
    userName: initialAllocation?.user.name || 'System User',
    action: 'CREATE_PART',
    entity: 'PartMaster',
    entityId: partId,
    details: `Created Mercedes-Benz Part ${partRecord.partNumber} (${partRecord.nameEn}) with initial stock ${initQty}`,
    timestamp: now
  });

  await batch.commit();
  return partId;
}

export async function updatePart(id: string, updates: Partial<PartMaster>, user?: { id: string; name: string }): Promise<void> {
  const partRef = doc(db, PARTS_COL, id);
  const now = new Date().toISOString();
  await updateDoc(partRef, {
    ...updates,
    updatedAt: now
  });

  if (user) {
    await addDoc(collection(db, AUDIT_LOGS_COL), {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE_PART',
      entity: 'PartMaster',
      entityId: id,
      details: `Updated part details for ${updates.partNumber || id}`,
      timestamp: now
    });
  }
}

// ----------------------------------------------------
// INVENTORY & STOCK MOVEMENT SERVICE
// ----------------------------------------------------

export function subscribeInventory(callback: (items: InventoryItem[]) => void) {
  const q = query(collection(db, INVENTORY_COL));
  return onSnapshot(q, (snapshot) => {
    const items: InventoryItem[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) });
    });
    if (items.length === 0) {
      callback(INITIAL_INVENTORY);
    } else {
      callback(items);
    }
  }, (err) => {
    console.warn('Firestore inventory subscription fallback:', err);
    callback(INITIAL_INVENTORY);
  });
}

export function subscribeStockMovements(callback: (movements: StockMovement[]) => void) {
  const q = query(collection(db, MOVEMENTS_COL));
  return onSnapshot(q, (snapshot) => {
    const list: StockMovement[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<StockMovement, 'id'>) });
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (list.length === 0) {
      callback(INITIAL_STOCK_MOVEMENTS);
    } else {
      callback(list);
    }
  }, (err) => {
    console.warn('Firestore movements fallback:', err);
    callback(INITIAL_STOCK_MOVEMENTS);
  });
}

/**
 * Execute Stock Movement / Inventory Adjustment atomically with audit ledger
 */
export async function executeStockMovement(params: {
  part: PartMaster;
  movementType: MovementType;
  quantityDelta: number; // e.g. +5 for purchase, -2 for sale, or exact change for adjustment
  branch: Branch;
  warehouse: Warehouse;
  location: WarehouseLocation;
  targetLocation?: WarehouseLocation; // If movement is TRANSFER
  reference?: string;
  reason: string;
  user: { id: string; name: string };
}): Promise<void> {
  const { part, movementType, quantityDelta, branch, warehouse, location, targetLocation, reference, reason, user } = params;
  const now = new Date().toISOString();
  const batch = writeBatch(db);

  // 1. Find existing inventory in this source location
  const invQuery = query(
    collection(db, INVENTORY_COL),
    where('partId', '==', part.id),
    where('locationId', '==', location.id)
  );
  const invSnap = await getDocs(invQuery);

  let currentSourceQty = 0;
  let sourceInvRef: ReturnType<typeof doc>;

  if (!invSnap.empty) {
    const existingDoc = invSnap.docs[0];
    sourceInvRef = existingDoc.ref;
    currentSourceQty = existingDoc.data().quantity || 0;
  } else {
    const newInvId = `inv_${part.partNumber}_${location.code.replace(/[^a-zA-Z0-9]/g, '')}`;
    sourceInvRef = doc(db, INVENTORY_COL, newInvId);
  }

  let newSourceQty = currentSourceQty;

  if (movementType === 'TRANSFER' && targetLocation) {
    // Deduct from source
    newSourceQty = Math.max(0, currentSourceQty - Math.abs(quantityDelta));
    
    // Update source
    batch.set(sourceInvRef, {
      id: sourceInvRef.id,
      partId: part.id,
      partNumber: part.partNumber,
      partNameEn: part.nameEn,
      partNameAr: part.nameAr,
      branchId: branch.id,
      branchName: branch.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      locationId: location.id,
      locationCode: location.code,
      quantity: newSourceQty,
      reservedQuantity: 0,
      availableQuantity: newSourceQty,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      lastMovementDate: now,
      updatedAt: now
    }, { merge: true });

    // Add to target location
    const targetInvQuery = query(
      collection(db, INVENTORY_COL),
      where('partId', '==', part.id),
      where('locationId', '==', targetLocation.id)
    );
    const targetSnap = await getDocs(targetInvQuery);
    let currentTargetQty = 0;
    let targetInvRef: ReturnType<typeof doc>;

    if (!targetSnap.empty) {
      targetInvRef = targetSnap.docs[0].ref;
      currentTargetQty = targetSnap.docs[0].data().quantity || 0;
    } else {
      const targetInvId = `inv_${part.partNumber}_${targetLocation.code.replace(/[^a-zA-Z0-9]/g, '')}`;
      targetInvRef = doc(db, INVENTORY_COL, targetInvId);
    }

    const newTargetQty = currentTargetQty + Math.abs(quantityDelta);
    batch.set(targetInvRef, {
      id: targetInvRef.id,
      partId: part.id,
      partNumber: part.partNumber,
      partNameEn: part.nameEn,
      partNameAr: part.nameAr,
      branchId: targetLocation.branchId || branch.id,
      branchName: branch.name,
      warehouseId: targetLocation.warehouseId || warehouse.id,
      warehouseName: targetLocation.warehouseName || warehouse.name,
      locationId: targetLocation.id,
      locationCode: targetLocation.code,
      quantity: newTargetQty,
      reservedQuantity: 0,
      availableQuantity: newTargetQty,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      lastMovementDate: now,
      updatedAt: now
    }, { merge: true });

  } else {
    // Standard Adjustment, Purchase, Sale, Scrap
    newSourceQty = Math.max(0, currentSourceQty + quantityDelta);
    batch.set(sourceInvRef, {
      id: sourceInvRef.id,
      partId: part.id,
      partNumber: part.partNumber,
      partNameEn: part.nameEn,
      partNameAr: part.nameAr,
      branchId: branch.id,
      branchName: branch.name,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      locationId: location.id,
      locationCode: location.code,
      quantity: newSourceQty,
      reservedQuantity: 0,
      availableQuantity: newSourceQty,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      lastMovementDate: now,
      updatedAt: now
    }, { merge: true });
  }

  // 2. Record Stock Movement Ledger
  const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const movRecord: StockMovement = {
    id: movId,
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.nameEn,
    movementType,
    quantity: quantityDelta,
    previousQuantity: currentSourceQty,
    newQuantity: newSourceQty,
    branchId: branch.id,
    branchName: branch.name,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    sourceLocation: location.code,
    destinationLocation: targetLocation ? targetLocation.code : location.code,
    reference: reference || `REF-${Date.now().toString().slice(-6)}`,
    reason,
    userId: user.id,
    userName: user.name,
    timestamp: now
  };
  batch.set(doc(db, MOVEMENTS_COL, movId), movRecord);

  // 3. Update Part Master totalStock
  const netPartDelta = movementType === 'TRANSFER' ? 0 : quantityDelta;
  const newPartTotalStock = Math.max(0, (part.totalStock || 0) + netPartDelta);
  batch.update(doc(db, PARTS_COL, part.id), {
    totalStock: newPartTotalStock,
    availableStock: newPartTotalStock,
    updatedAt: now
  });

  // 4. Audit Log
  const auditId = `audit_${Date.now()}`;
  batch.set(doc(db, AUDIT_LOGS_COL, auditId), {
    id: auditId,
    userId: user.id,
    userName: user.name,
    action: movementType,
    entity: 'Inventory',
    entityId: part.partNumber,
    details: `${movementType} of ${Math.abs(quantityDelta)} units for ${part.partNumber} at location ${location.code} by ${user.name}`,
    timestamp: now
  });

  await batch.commit();
}

// ----------------------------------------------------
// BRANCHES, WAREHOUSES & LOCATIONS SERVICE
// ----------------------------------------------------

export function subscribeBranches(callback: (branches: Branch[]) => void) {
  const q = query(collection(db, BRANCHES_COL));
  return onSnapshot(q, (snapshot) => {
    const list: Branch[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Branch, 'id'>) }));
    callback(list.length > 0 ? list : INITIAL_BRANCHES);
  }, () => callback(INITIAL_BRANCHES));
}

export function subscribeWarehouses(callback: (warehouses: Warehouse[]) => void) {
  const q = query(collection(db, WAREHOUSES_COL));
  return onSnapshot(q, (snapshot) => {
    const list: Warehouse[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<Warehouse, 'id'>) }));
    callback(list.length > 0 ? list : INITIAL_WAREHOUSES);
  }, () => callback(INITIAL_WAREHOUSES));
}

export function subscribeLocations(callback: (locations: WarehouseLocation[]) => void) {
  const q = query(collection(db, LOCATIONS_COL));
  return onSnapshot(q, (snapshot) => {
    const list: WarehouseLocation[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<WarehouseLocation, 'id'>) }));
    callback(list.length > 0 ? list : INITIAL_LOCATIONS);
  }, () => callback(INITIAL_LOCATIONS));
}

export function subscribeCategories(callback: (categories: EpcCategory[]) => void) {
  const q = query(collection(db, CATEGORIES_COL));
  return onSnapshot(q, (snapshot) => {
    const list: EpcCategory[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<EpcCategory, 'id'>) }));
    callback(list.length > 0 ? list : INITIAL_EPC_CATEGORIES);
  }, () => callback(INITIAL_EPC_CATEGORIES));
}

export function subscribeAuditLogs(callback: (logs: AuditLog[]) => void) {
  const q = query(collection(db, AUDIT_LOGS_COL));
  return onSnapshot(q, (snapshot) => {
    const list: AuditLog[] = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) }));
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(list);
  }, () => callback([]));
}

export async function createWarehouseLocation(locData: Omit<WarehouseLocation, 'id' | 'createdAt'>): Promise<string> {
  const locId = `loc_${locData.code.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
  const now = new Date().toISOString();
  await setDoc(doc(db, LOCATIONS_COL, locId), {
    ...locData,
    id: locId,
    createdAt: now
  });
  return locId;
}

/**
 * Smart Location Recommendation: Find an ideal adjacent bin in the same zone/category
 */
export function recommendOptimalBinLocation(
  categoryGroup: string,
  allLocations: WarehouseLocation[],
  currentInventory: InventoryItem[]
): WarehouseLocation | null {
  // Map category to preferred zone
  let preferredZone = 'A';
  if (categoryGroup.includes('BRAKES') || categoryGroup.includes('SUSPENSION')) preferredZone = 'B';
  else if (categoryGroup.includes('BODY') || categoryGroup.includes('LIGHTING')) preferredZone = 'C';
  else if (categoryGroup.includes('ELECTRICAL') || categoryGroup.includes('SENSOR')) preferredZone = 'D';

  const zoneLocations = allLocations.filter(loc => loc.zone === preferredZone && loc.status === 'ACTIVE');
  
  if (zoneLocations.length === 0) {
    return allLocations.find(loc => loc.status === 'ACTIVE') || null;
  }

  // Find location with lowest occupancy relative to capacity
  const sorted = [...zoneLocations].sort((a, b) => {
    const aUsed = a.currentUnits || 0;
    const bUsed = b.currentUnits || 0;
    const aRatio = aUsed / (a.capacity || 1);
    const bRatio = bUsed / (b.capacity || 1);
    return aRatio - bRatio;
  });

  return sorted[0] || null;
}
