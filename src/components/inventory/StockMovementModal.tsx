import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeftRight, 
  Layers, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  FileText 
} from 'lucide-react';
import { PartMaster, WarehouseLocation, Branch, Warehouse, MovementType } from '../../types/erp';
import { useAuth } from '../../lib/authContext';
import { executeStockMovement } from '../../lib/firestoreService';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: PartMaster[];
  locations: WarehouseLocation[];
  warehouses: Warehouse[];
  branches: Branch[];
  preselectedPart?: PartMaster | null;
  onSuccess: () => void;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  parts,
  locations,
  warehouses,
  branches,
  preselectedPart,
  onSuccess
}) => {
  const { currentUser, activeBranch } = useAuth();

  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [movementType, setMovementType] = useState<MovementType>('PURCHASE');
  const [quantity, setQuantity] = useState<number>(5);
  const [sourceLocationId, setSourceLocationId] = useState<string>('');
  const [targetLocationId, setTargetLocationId] = useState<string>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Part
  const activePart = parts.find(p => p.id === selectedPartId) || parts[0];

  useEffect(() => {
    if (preselectedPart) {
      setSelectedPartId(preselectedPart.id);
    } else if (parts.length > 0 && !selectedPartId) {
      setSelectedPartId(parts[0].id);
    }
  }, [preselectedPart, parts, selectedPartId]);

  useEffect(() => {
    if (locations.length > 0) {
      if (!sourceLocationId) setSourceLocationId(locations[0].id);
      if (!targetLocationId && locations.length > 1) setTargetLocationId(locations[1].id);
    }
  }, [locations, sourceLocationId, targetLocationId]);

  if (!isOpen || !activePart) return null;

  const sourceLoc = locations.find(l => l.id === sourceLocationId) || locations[0];
  const targetLoc = locations.find(l => l.id === targetLocationId) || locations[1] || locations[0];
  const defaultWarehouse = warehouses[0] || { id: 'wh_main', name: 'Central Logistics Warehouse' };

  // Calculate delta based on movement type
  let quantityDelta = Math.abs(quantity);
  if (['SALE', 'DAMAGED', 'LOST', 'SUPPLIER_RETURN'].includes(movementType)) {
    quantityDelta = -Math.abs(quantity);
  } else if (movementType === 'TRANSFER') {
    quantityDelta = Math.abs(quantity);
  }

  const projectedNewTotal = movementType === 'TRANSFER'
    ? activePart.totalStock
    : Math.max(0, activePart.totalStock + quantityDelta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (quantity <= 0) {
      setErrorMsg('يجب أن تكون الكمية أكبر من الصفر.');
      return;
    }

    if (movementType === 'TRANSFER' && sourceLoc.id === targetLoc.id) {
      setErrorMsg('يجب أن يكون موقع الرف المصدر مختلفاً عن موقع الرف الوجهة لإجراء النقل.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('يرجى كتابة سبب أو بيان للعملية لأغراض التدقيق المحاسبي والمخزني.');
      return;
    }

    setLoading(true);
    try {
      await executeStockMovement({
        part: activePart,
        movementType,
        quantityDelta,
        branch: activeBranch,
        warehouse: defaultWarehouse,
        location: sourceLoc,
        targetLocation: movementType === 'TRANSFER' ? targetLoc : undefined,
        reference: referenceDoc.trim() || `REF-${Date.now().toString().slice(-6)}`,
        reason: reason.trim(),
        user: {
          id: currentUser.id,
          name: currentUser.displayName
        }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Movement execution error:', err);
      setErrorMsg(err.message || 'فشل تسجيل الحركة المخزنية.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="w-full max-w-xl bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center text-white">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-medium text-white text-base">
                تسجيل حركة مخزنية
              </h2>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                سند رسمي لاستلام، صرف، تحويل بين الأرفف، أو تسوية جردية للقطع
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Part Selection */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1">
              اختر قطعة غيار مرسيدس-بنز *
            </label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono"
            >
              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partNumber} — {p.nameAr || p.nameEn} (الرصيد الحالي: {p.totalStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-zinc-400 text-xs mb-1.5">
              نوع المعاملة المخزنية *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'PURCHASE', label: 'استلام مشتريات' },
                { id: 'SALE', label: 'صرف مبيعات' },
                { id: 'TRANSFER', label: 'نقل بين الأرفف' },
                { id: 'ADJUSTMENT', label: 'تسوية جردية' },
                { id: 'DAMAGED', label: 'هالك / تالف' },
                { id: 'CUSTOMER_RETURN', label: 'مرتجع عميل' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMovementType(m.id as MovementType)}
                  className={`p-2.5 rounded-xl text-center text-xs transition font-medium ${
                    movementType === m.id
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'bg-[#141416] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Balance Preview */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs mb-1">
                الكمية ({activePart.unit}) *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono text-base"
                required
              />
            </div>

            {/* Projected Balance Pill */}
            <div className="p-3 bg-[#141416] rounded-xl border border-white/10 flex flex-col justify-center text-center">
              <span className="text-xs text-zinc-400">الرصيد المتوقع بعد الحركة</span>
              <div className="font-mono text-base text-white mt-0.5">
                {activePart.totalStock} ← <span className="text-emerald-400 font-bold">{projectedNewTotal}</span> {activePart.unit}
              </div>
            </div>
          </div>

          {/* Storage Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs mb-1">
                {movementType === 'TRANSFER' ? 'رف التخزين المصدر' : 'موقع الرف بالمستودع'} *
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-white/40"
              >
                {locations.map(l => (
                  <option key={l.id} value={l.id}>
                    الرف: {l.code} (المنطقة {l.zone} • {l.notes || 'موقع'})
                  </option>
                ))}
              </select>
            </div>

            {movementType === 'TRANSFER' && (
              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  رف التخزين الوجهة (المستقبل) *
                </label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:border-white/40"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>
                      الرف: {l.code} (المنطقة {l.zone} • {l.notes || 'موقع'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Reference & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs mb-1">
                رقم المستند المرجعي / الفاتورة / أمر الشراء
              </label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="مثال: PO-GERMANY-104 أو INV-89"
                className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs mb-1">
                الموظف المنفذ للحركة
              </label>
              <input
                type="text"
                disabled
                value={`${currentUser.displayName} (${currentUser.role === 'ADMIN' ? 'مدير النظام' : 'أمين مخزن'})`}
                className="w-full bg-[#141416] border border-white/5 rounded-xl px-3.5 py-2.5 text-zinc-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-1">
              السبب والمبرر المخزني للعملية *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: استلام حاوية قطع غيار أصلية من ألمانيا ومطابقة أرقام الشاسيه"
              className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-light"
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-full font-medium transition border border-white/10 text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full font-medium transition shadow-sm text-xs"
            >
              {loading ? 'جاري الاعتماد...' : 'اعتماد وتسجيل الحركة'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
