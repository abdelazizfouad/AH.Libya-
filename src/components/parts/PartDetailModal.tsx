import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  MapPin, 
  Car, 
  Clock, 
  QrCode, 
  Barcode, 
  ArrowLeftRight, 
  Edit3, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { PartMaster, InventoryItem, StockMovement, WarehouseLocation } from '../../types/erp';
import { useAuth } from '../../lib/authContext';
import { recommendOptimalBinLocation } from '../../lib/firestoreService';

interface PartDetailModalProps {
  part: PartMaster | null;
  onClose: () => void;
  inventory: InventoryItem[];
  movements: StockMovement[];
  allLocations: WarehouseLocation[];
  onOpenEditPart: (part: PartMaster) => void;
  onOpenMovementModal: (part: PartMaster) => void;
}

export const PartDetailModal: React.FC<PartDetailModalProps> = ({
  part,
  onClose,
  inventory,
  movements,
  allLocations,
  onOpenEditPart,
  onOpenMovementModal
}) => {
  const { canEditParts, canPerformStockMovements, canViewFinancials } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOCATIONS' | 'COMPATIBILITY' | 'LEDGER' | 'LABEL'>('OVERVIEW');

  if (!part) return null;

  // Inventory locations for this part
  const partInventory = inventory.filter((inv) => inv.partId === part.id);
  
  // Stock movements for this part
  const partMovements = movements.filter((m) => m.partId === part.id || m.partNumber === part.partNumber);

  // Recommended bin
  const recommendedBin = recommendOptimalBinLocation(part.categoryGroup, allLocations, inventory);

  // Print Label Handler
  const handlePrintLabel = () => {
    window.print();
  };

  const isLow = part.totalStock > 0 && part.totalStock <= part.minStock;
  const isOut = part.totalStock === 0;

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'GENUINE_OEM': return 'أصلي وكالة OEM';
      case 'ORIGINAL': return 'أصلي مرسيدس Genuine';
      case 'AFTERMARKET': return 'بديل معتمد Aftermarket';
      case 'REMANUFACTURED': return 'مجدد معتمد Reman';
      default: return quality;
    }
  };

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'جديد';
      case 'REFURBISHED': return 'مجدد';
      case 'USED': return 'مستعمل بحالة ممتازة';
      default: return condition;
    }
  };

  const getMovementTypeArabic = (type: string) => {
    switch (type) {
      case 'INITIAL_STOCK': return 'رصيد افتتاحي';
      case 'PURCHASE': return 'توريد / شراء';
      case 'SALE': return 'صرف / مبيعات';
      case 'TRANSFER': return 'نقل بين الأرفف';
      case 'ADJUSTMENT': return 'تسوية جرد';
      case 'DAMAGED': return 'تالف / هالك';
      case 'CUSTOMER_RETURN': return 'مرتجع عميل';
      case 'SUPPLIER_RETURN': return 'مرتجع مورد';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="w-full max-w-4xl bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center text-white font-bold text-sm">
              MB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono font-medium text-white text-base tracking-wider">
                  {part.partNumber}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-400 font-medium border border-zinc-800">
                  {getQualityLabel(part.quality)}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-400 font-medium border border-zinc-800">
                  {getConditionLabel(part.condition)}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium mt-0.5">{part.nameAr || part.nameEn}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canPerformStockMovements && (
              <button
                onClick={() => onOpenMovementModal(part)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-300 border border-white/10 hover:border-white rounded-full text-xs font-medium transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>حركة مخزنية</span>
              </button>
            )}

            {canEditParts && (
              <button
                onClick={() => onOpenEditPart(part)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-white/10 bg-[#0c0c0e]/60 text-xs overflow-x-auto">
          {[
            { id: 'OVERVIEW', label: 'نظرة عامة والأسعار' },
            { id: 'LOCATIONS', label: `مواقع الأرفف بالمخزن (${partInventory.length})` },
            { id: 'COMPATIBILITY', label: `موديلات السيارات المتوافقة (${part.compatibility.length})` },
            { id: 'LEDGER', label: `سجل الحركات (${partMovements.length})` },
            { id: 'LABEL', label: 'طباعة الباركود والملصق' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 font-medium border-b-2 transition whitespace-nowrap text-xs ${
                activeTab === tab.id
                  ? 'border-white text-white bg-white/5'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Top Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Stock on Hand */}
                <div className="p-5 bg-[#141416] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    الرصيد الفعلي المتوفر
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl text-white font-mono">
                      {part.totalStock}
                    </span>
                    <span className="text-xs text-zinc-500 font-light">{part.unit === 'PCS' ? 'قطعة' : part.unit}</span>
                  </div>
                  <div className="text-[11px] mt-2 font-medium">
                    {isOut ? (
                      <span className="text-zinc-500">نفد المخزون (0)</span>
                    ) : isLow ? (
                      <span className="text-zinc-300">مخزون منخفض (≤ {part.minStock})</span>
                    ) : (
                      <span className="text-zinc-400">متوفر في المستودع</span>
                    )}
                  </div>
                </div>

                {/* Selling Price */}
                <div className="p-5 bg-[#141416] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    سعر البيع للجمهور (قطاعي)
                  </span>
                  <div className="text-3xl text-white font-mono mt-1">
                    ${part.sellingPrice}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light mt-1">
                    سعر الجملة / الورش: <strong className="text-zinc-300 font-mono font-normal">${part.wholesalePrice || part.sellingPrice}</strong>
                  </div>
                </div>

                {/* Landed Cost (Restricted) */}
                <div className="p-5 bg-[#141416] border border-white/5 rounded-xl space-y-1">
                  <span className="text-[10px] font-semibold text-zinc-400">
                    سعر التكلفة الاستيرادية
                  </span>
                  <div className="text-3xl text-white font-mono mt-1">
                    {canViewFinancials ? `$${part.costPrice}` : '••••'}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light mt-1">
                    هامش الربح: {canViewFinancials ? `${Math.round(((part.sellingPrice - part.costPrice) / part.sellingPrice) * 100)}%` : '••••'}
                  </div>
                </div>

              </div>

              {/* EPC Metadata & Arabic Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 bg-[#141416] border border-white/5 rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-zinc-400" />
                    <span>بيانات كتالوج مرسيدس EPC</span>
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500 font-light">المجموعة الرئيسية EPC:</span>
                      <span className="font-medium text-zinc-200">{part.categoryGroup}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500 font-light">المجموعة الفرعية:</span>
                      <span className="font-medium text-zinc-200">{part.subgroup || 'افتراضي'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500 font-light">مخطط EPC / رقم الموضع:</span>
                      <span className="font-mono font-medium text-zinc-200">
                        {part.epcIllustration || '—'} / الموضع: {part.epcPosition || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-zinc-500 font-light">الجانب والموقع في السيارة:</span>
                      <span className="font-medium text-zinc-200">
                        {part.side || 'غير محدد'} • {part.position || 'غير محدد'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-500 font-light">الشركة المصنعة:</span>
                      <span className="font-medium text-zinc-200">{part.brand}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-[#141416] border border-white/5 rounded-xl space-y-3">
                  <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-zinc-400" />
                    <span>الاسم والمواصفات الفنية</span>
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">الاسم بالعربي:</span>
                      <p className="text-zinc-100 font-medium text-sm mt-0.5">{part.nameAr || '—'}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[11px]">الاسم بالإنجليزي:</span>
                      <p className="text-zinc-300 text-xs mt-0.5">{part.nameEn}</p>
                    </div>
                    {part.description && (
                      <div>
                        <span className="text-zinc-500 block text-[11px]">ملاحظات فنية / وصف:</span>
                        <p className="text-zinc-400 text-xs mt-0.5 font-light leading-relaxed">{part.description}</p>
                      </div>
                    )}
                    {part.supersededNumbers.length > 0 && (
                      <div>
                        <span className="text-zinc-500 block text-[11px]">أرقام قطع بديلة ومستبدلة:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {part.supersededNumbers.map((sn, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-300 border border-zinc-800 font-mono text-[10px]">
                              {sn}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {part.alternativeNumbers.length > 0 && (
                      <div>
                        <span className="text-zinc-500 block text-[11px]">أرقام متطابقة من شركات أخرى:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {part.alternativeNumbers.map((an, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-[#18181b] text-zinc-300 border border-zinc-800 font-mono text-[10px]">
                              {an}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: WAREHOUSE BINS & INVENTORY */}
          {activeTab === 'LOCATIONS' && (
            <div className="space-y-5">
              
              {/* Smart Location Recommendation */}
              {recommendedBin && (
                <div className="p-4 bg-[#141416] border border-white/10 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      توصية التخزين الذكي
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5 font-light">
                      موقع الرف الأمثل المقترح لهذا الصنف: <strong className="text-white font-mono">{recommendedBin.code}</strong> (المنطقة {recommendedBin.zone} • {recommendedBin.notes || 'رف مجاور'})
                    </p>
                  </div>
                </div>
              )}

              {/* Current Storage Bins Table */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 mb-3">
                  أرفف التخزين الحالية للقطعة {part.partNumber}
                </h4>

                {partInventory.length === 0 ? (
                  <div className="p-8 text-center bg-[#141416] border border-white/5 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-500 font-light">
                      لا يوجد رصيد مخصص على أي رف حالياً.
                    </p>
                    {canPerformStockMovements && (
                      <button
                        onClick={() => onOpenMovementModal(part)}
                        className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-full transition"
                      >
                        استلام وتخزين على رف +
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {partInventory.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-4 bg-[#141416] border border-white/5 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-zinc-300">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-mono font-medium text-white text-xs tracking-wider">
                              الرف: {inv.locationCode}
                            </div>
                            <div className="text-xs text-zinc-500 font-light">
                              {inv.branchName || 'الفرع الرئيسي'} • {inv.warehouseName || 'المستودع المركزي'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <div className="text-sm font-medium text-white font-mono">
                              {inv.quantity} {part.unit === 'PCS' ? 'قطعة' : part.unit}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-light">
                              المتاح للصرف: {inv.availableQuantity}
                            </div>
                          </div>

                          {canPerformStockMovements && (
                            <button
                              onClick={() => onOpenMovementModal(part)}
                              className="p-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-400 rounded-full border border-white/10 text-xs transition"
                              title="نقل أو تعديل الرصيد"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: VEHICLE COMPATIBILITY */}
          {activeTab === 'COMPATIBILITY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-400">
                  دليل توافقية سيارات مرسيدس-بنز ({part.compatibility.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {part.compatibility.map((comp, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#141416] border border-white/5 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono font-medium text-white text-xs tracking-wider">
                          {comp.chassis}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono font-light">
                        {comp.yearFrom ? `${comp.yearFrom} – ${comp.yearTo || 'حتى الآن'}` : 'جميع السنوات'}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-zinc-200">
                      {comp.model}
                    </div>

                    {comp.engine && (
                      <div className="text-[11px] text-zinc-500 font-mono font-light">
                        رمز المحرك: <strong className="text-zinc-300 font-normal">{comp.engine}</strong>
                      </div>
                    )}

                    {comp.notes && (
                      <div className="text-[11px] text-zinc-500 italic font-light">
                        {comp.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MOVEMENT HISTORY LEDGER */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400">
                سجل حركات وتدقيق المخزون للقطعة {part.partNumber}
              </h4>

              {partMovements.length === 0 ? (
                <div className="p-8 text-center bg-[#141416] border border-white/5 rounded-xl text-xs text-zinc-600 font-light">
                  لا توجد حركات مخزنية مسجلة لهذه القطعة حتى الآن.
                </div>
              ) : (
                <div className="space-y-2">
                  {partMovements.map((mov) => {
                    const isPositive = mov.quantity > 0;
                    return (
                      <div
                        key={mov.id}
                        className="p-3.5 bg-[#141416] border border-white/5 rounded-xl text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-200 text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                              {getMovementTypeArabic(mov.movementType)}
                            </span>
                            <span className="font-mono text-zinc-500 text-[10px]">
                              إذن رقم: {mov.reference || '—'}
                            </span>
                          </div>
                          <span className={`font-mono text-xs ${
                            isPositive ? 'text-zinc-200' : 'text-zinc-400'
                          }`}>
                            {isPositive ? `+${mov.quantity}` : mov.quantity} قطعة (الرصيد بعدها: {mov.newQuantity})
                          </span>
                        </div>

                        <div className="text-zinc-400 text-xs font-light">
                          {mov.reason}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-white/5">
                          <span>بواسطة: <strong className="text-zinc-400 font-normal">{mov.userName}</strong></span>
                          <span>{new Date(mov.timestamp).toLocaleString('ar-LY')}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BARCODE & QR LABEL */}
          {activeTab === 'LABEL' && (
            <div className="space-y-5 max-w-md mx-auto text-center">
              <div className="p-6 bg-white text-zinc-950 rounded-2xl border border-white/20 shadow-2xl space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-zinc-200 pb-1 flex justify-between">
                  <span>أشرف وهشام ليبيا</span>
                  <span>MERCEDES-BENZ</span>
                </div>

                <div className="font-mono font-bold text-2xl tracking-wider text-black">
                  {part.partNumber}
                </div>

                <div className="text-xs font-medium text-zinc-800">
                  {part.nameAr || part.nameEn}
                </div>

                <div className="text-[11px] text-zinc-600 font-sans">
                  {part.nameEn}
                </div>

                {/* Simulated Barcode Lines */}
                <div className="py-2 flex flex-col items-center justify-center space-y-1">
                  <div className="h-12 w-4/5 bg-[repeating-linear-gradient(90deg,#000,#000_2px,#fff_2px,#fff_4px,#000_4px,#000_7px,#fff_7px,#fff_9px)] rounded" />
                  <span className="font-mono text-xs tracking-widest text-zinc-800">
                    {part.barcode || part.partNumber}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-600 border-t border-zinc-200 pt-2 flex justify-between">
                  <span>المجموعة: {part.categoryGroup}</span>
                  <span>الجودة: {getQualityLabel(part.quality)}</span>
                </div>
              </div>

              <button
                onClick={handlePrintLabel}
                className="px-5 py-2.5 bg-[#18181b] hover:bg-white hover:text-black text-white rounded-full text-xs font-medium transition border border-white/15 hover:border-white flex items-center justify-center gap-2 mx-auto"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
                <span>طباعة الملصق الحراري</span>
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0c0c0e] border-t border-white/10 text-xs text-zinc-500 flex items-center justify-between font-light">
          <span className="font-mono text-[11px]">معرف الصنف: {part.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-full font-medium transition border border-white/10 text-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
