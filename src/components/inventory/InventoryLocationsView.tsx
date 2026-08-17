import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  MapPin, 
  Search, 
  Plus, 
  ArrowLeftRight, 
  Layers, 
  Eye, 
  QrCode, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Warehouse as WarehouseIcon,
  Tag,
  X
} from 'lucide-react';
import { WarehouseLocation, InventoryItem, PartMaster, Warehouse, Branch } from '../../types/erp';
import { useAuth } from '../../lib/authContext';
import { createWarehouseLocation } from '../../lib/firestoreService';

interface InventoryLocationsViewProps {
  locations: WarehouseLocation[];
  inventory: InventoryItem[];
  parts: PartMaster[];
  warehouses: Warehouse[];
  branches: Branch[];
  onSelectPart: (part: PartMaster) => void;
  onOpenMovementModal: (part?: PartMaster) => void;
}

export const InventoryLocationsView: React.FC<InventoryLocationsViewProps> = ({
  locations,
  inventory,
  parts,
  warehouses,
  branches,
  onSelectPart,
  onOpenMovementModal
}) => {
  const { activeBranch, canManageWarehouseLocations } = useAuth();

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBinForInspect, setSelectedBinForInspect] = useState<WarehouseLocation | null>(null);
  
  // New Location Form State
  const [showAddLocModal, setShowAddLocModal] = useState<boolean>(false);
  const [newZone, setNewZone] = useState('A');
  const [newAisle, setNewAisle] = useState('01');
  const [newShelf, setNewShelf] = useState('01');
  const [newBin, setNewBin] = useState('01');
  const [newCapacity, setNewCapacity] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [savingLoc, setSavingLoc] = useState(false);

  // Distinct Zones
  const zones = useMemo(() => {
    const set = new Set<string>();
    locations.forEach(l => set.add(l.zone));
    return Array.from(set).sort();
  }, [locations]);

  // Filtered Locations
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (selectedZone !== 'ALL' && loc.zone !== selectedZone) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesCode = loc.code.toLowerCase().includes(term);
        const matchesNotes = (loc.notes || '').toLowerCase().includes(term);
        if (!matchesCode && !matchesNotes) return false;
      }
      return true;
    });
  }, [locations, selectedZone, searchTerm]);

  // Aggregate inventory by location
  const inventoryByLocation = useMemo(() => {
    const map: Record<string, { items: InventoryItem[]; totalUnits: number }> = {};
    inventory.forEach((inv) => {
      const key = inv.locationId || inv.locationCode;
      if (!map[key]) {
        map[key] = { items: [], totalUnits: 0 };
      }
      map[key].items.push(inv);
      map[key].totalUnits += inv.quantity;
    });
    return map;
  }, [inventory]);

  // Handle Add Location
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLoc(true);
    try {
      const code = `${newZone}-${newAisle.padStart(2, '0')}-${newShelf.padStart(2, '0')}-${newBin.padStart(2, '0')}`;
      const defaultWh = warehouses[0] || { id: 'wh_main', name: 'Main Warehouse' };
      
      await createWarehouseLocation({
        warehouseId: defaultWh.id,
        warehouseName: defaultWh.name,
        branchId: activeBranch.id,
        zone: newZone.toUpperCase(),
        aisle: newAisle.padStart(2, '0'),
        shelf: newShelf.padStart(2, '0'),
        bin: newBin.padStart(2, '0'),
        code,
        capacity: Number(newCapacity),
        status: 'ACTIVE',
        notes: newNotes.trim()
      });

      setShowAddLocModal(false);
      setNewNotes('');
    } catch (err) {
      console.error('Failed to create location:', err);
    } finally {
      setSavingLoc(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              إدارة أرفف ومواقع التخزين بالمستودع
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-3 py-1 rounded-full font-mono border border-zinc-800">
              {filteredLocations.length} رف نشط
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            الهيكل التخزيني: المنطقة (Zone) ← الممر (Aisle) ← الرف (Shelf) ← الصندوق (Bin) — مثل: <strong className="text-zinc-200 font-mono font-normal">A-03-02-07</strong>
          </p>
        </div>

        {canManageWarehouseLocations && (
          <button
            onClick={() => setShowAddLocModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة موقع رف جديد +</span>
          </button>
        )}
      </div>

      {/* Filter and Zone Selector Tabs */}
      <div className="bg-[#141416] border border-white/5 rounded-xl p-4 space-y-3 shadow-sm">
        
        {/* Zone selection buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-semibold text-zinc-400 ml-1 text-xs">
            مناطق المستودع:
          </span>
          <button
            onClick={() => setSelectedZone('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              selectedZone === 'ALL'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#18181b] text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            جميع المناطق ({locations.length})
          </button>

          {zones.map((z) => {
            const count = locations.filter(l => l.zone === z).length;
            let zoneDesc = 'عام';
            if (z === 'A') zoneDesc = 'المحرك وناقل الحركة';
            else if (z === 'B') zoneDesc = 'الفرامل والتعليق';
            else if (z === 'C') zoneDesc = 'الهيكل والإضاءة';
            else if (z === 'D') zoneDesc = 'الإلكترونيات والكهرباء';

            return (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
                  selectedZone === z
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                <span>المنطقة {z}</span>
                <span className="text-[10px] opacity-70 font-light">({zoneDesc} • {count})</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برمز الرف (مثل A-03-02-07)، المنطقة، أو ملاحظات الصنف..."
            className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl pr-9 pl-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none transition"
          />
        </div>

      </div>

      {/* Grid of Storage Bins */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredLocations.map((loc) => {
          const locInv = inventoryByLocation[loc.id] || inventoryByLocation[loc.code] || { items: [], totalUnits: 0 };
          const occupancyRate = Math.min(100, Math.round((locInv.totalUnits / (loc.capacity || 1)) * 100));

          return (
            <div
              key={loc.id}
              onClick={() => setSelectedBinForInspect(loc)}
              className="bg-[#141416] border border-white/5 hover:border-white/20 rounded-xl p-4 cursor-pointer transition shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-zinc-300">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-mono font-medium text-white text-xs tracking-wider group-hover:text-zinc-200 transition">
                      {loc.code}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-400 border border-zinc-800">
                    المنطقة {loc.zone}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 truncate mb-3 font-light">
                  {loc.notes || `الممر ${loc.aisle} • الرف ${loc.shelf} • الصندوق ${loc.bin}`}
                </div>

                {/* Occupancy Meter */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500 font-light">
                    <span>نسبة الإشغال</span>
                    <span className="font-mono text-zinc-300 text-xs">
                      {locInv.totalUnits} / {loc.capacity} ({occupancyRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#0c0c0e] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-zinc-300"
                      style={{ width: `${occupancyRate}%` }}
                    />
                  </div>
                </div>

                {/* Parts Preview in this bin */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-zinc-400">
                    القطع المخزنة ({locInv.items.length}):
                  </div>
                  {locInv.items.length === 0 ? (
                    <div className="text-xs text-zinc-600 italic font-light">رف شاغر (فارغ)</div>
                  ) : (
                    <div className="space-y-1">
                      {locInv.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-xs flex items-center justify-between text-zinc-300">
                          <span className="font-mono text-white text-xs truncate ml-1">
                            {item.partNumber}
                          </span>
                          <span className="font-mono text-zinc-400 text-xs shrink-0 font-light">
                            {item.quantity} قطعة
                          </span>
                        </div>
                      ))}
                      {locInv.items.length > 2 && (
                        <div className="text-[11px] text-zinc-500 font-light">
                          +{locInv.items.length - 2} قطع أخرى
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-light">
                <span>اضغط لمعاينة الرف</span>
                <span className="text-white font-medium group-hover:underline text-xs">عرض المحتويات ←</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Bin Inspector Drawer / Modal */}
      {selectedBinForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
          <div 
            className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-zinc-300">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono font-medium text-white text-base tracking-wider">
                      الرف: {selectedBinForInspect.code}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-400 font-mono border border-zinc-800">
                      المنطقة {selectedBinForInspect.zone}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-light mt-0.5">
                    الممر {selectedBinForInspect.aisle} • المستوى/الرف {selectedBinForInspect.shelf} • الخانة {selectedBinForInspect.bin}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBinForInspect(null)}
                className="text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Bin Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-[#141416] rounded-xl border border-white/5">
                  <span className="text-xs text-zinc-400 font-medium">السعة القصوى</span>
                  <div className="text-xl text-white font-mono mt-1">
                    {selectedBinForInspect.capacity} قطعة
                  </div>
                </div>
                <div className="p-4 bg-[#141416] rounded-xl border border-white/5">
                  <span className="text-xs text-zinc-400 font-medium">القطع المخزنة</span>
                  <div className="text-xl text-white font-mono mt-1">
                    {inventoryByLocation[selectedBinForInspect.id]?.totalUnits || inventoryByLocation[selectedBinForInspect.code]?.totalUnits || 0} قطعة
                  </div>
                </div>
                <div className="p-4 bg-[#141416] rounded-xl border border-white/5">
                  <span className="text-xs text-zinc-400 font-medium">الحالة</span>
                  <div className="text-xs font-mono text-zinc-300 mt-2 font-medium">
                    {selectedBinForInspect.status === 'ACTIVE' ? 'نشط متاح للتخزين' : selectedBinForInspect.status}
                  </div>
                </div>
              </div>

              {/* Stored Parts Table */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-3">
                  قطع الغيار المخزنة فعلياً في هذا الموقع
                </h4>

                {(() => {
                  const items = inventoryByLocation[selectedBinForInspect.id]?.items || inventoryByLocation[selectedBinForInspect.code]?.items || [];
                  if (items.length === 0) {
                    return (
                      <div className="p-8 text-center bg-[#141416] border border-white/5 rounded-xl text-xs text-zinc-500 font-light">
                        هذا الرف شاغر حالياً. جاهز لاستقبال بضائع جديدة.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {items.map((item) => {
                        const matchedPart = parts.find(p => p.id === item.partId || p.partNumber === item.partNumber);
                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-[#141416] border border-white/5 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-medium text-white text-xs tracking-wider">
                                  {item.partNumber}
                                </span>
                                {matchedPart && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-400 border border-zinc-800">
                                    {matchedPart.brand}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-medium text-zinc-200 mt-1">
                                {item.partNameAr || item.partNameEn}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-light">
                                {item.partNameEn}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-left">
                                <div className="text-sm font-medium text-white font-mono">
                                  {item.quantity} قطعة
                                </div>
                                <div className="text-[10px] text-zinc-500 font-light">
                                  المتاح للصرف: {item.availableQuantity}
                                </div>
                              </div>

                              {matchedPart && (
                                <button
                                  onClick={() => {
                                    onSelectPart(matchedPart);
                                    setSelectedBinForInspect(null);
                                  }}
                                  className="px-3.5 py-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-300 rounded-full text-xs font-medium transition border border-white/10"
                                >
                                  تفاصيل الصنف ←
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-[#0c0c0e] border-t border-white/10 text-xs flex justify-end">
              <button
                onClick={() => setSelectedBinForInspect(null)}
                className="px-4 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-full font-medium transition border border-white/10 text-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Bin Location Modal */}
      {showAddLocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
          <div 
            className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
              <h3 className="text-white text-sm font-medium">إضافة رف / موقع تخزين بالمستودع</h3>
              <button onClick={() => setShowAddLocModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">المنطقة</label>
                  <input
                    type="text"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value.toUpperCase())}
                    placeholder="A"
                    className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white font-mono font-bold uppercase text-center"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">الممر</label>
                  <input
                    type="text"
                    value={newAisle}
                    onChange={(e) => setNewAisle(e.target.value)}
                    placeholder="01"
                    className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white font-mono text-center"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">المستوى</label>
                  <input
                    type="text"
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    placeholder="01"
                    className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white font-mono text-center"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-1">الخانة</label>
                  <input
                    type="text"
                    value={newBin}
                    onChange={(e) => setNewBin(e.target.value)}
                    placeholder="01"
                    className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white font-mono text-center"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5 text-center font-mono">
                <span className="text-xs text-zinc-400">رمز الرف الناتج: </span>
                <span className="text-white font-bold text-xs tracking-wider">
                  {newZone}-{newAisle.padStart(2, '0')}-{newShelf.padStart(2, '0')}-{newBin.padStart(2, '0')}
                </span>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">سعة الرف الاستيعابية (قطعة)</label>
                <input
                  type="number"
                  min="1"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">ملاحظات / الأصناف المخصصة</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="مثال: فحمات ودسك فرامل ثقيلة"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddLocModal(false)}
                  className="px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-full font-medium text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingLoc}
                  className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-medium rounded-full transition text-xs"
                >
                  {savingLoc ? 'جاري الإنشاء...' : 'إنشاء موقع الرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
