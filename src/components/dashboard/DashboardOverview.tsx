import React from 'react';
import { 
  Layers, 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowLeftRight, 
  PlusCircle, 
  QrCode, 
  TrendingUp, 
  RotateCcw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  MapPin,
  Clock,
  ChevronLeft,
  Package
} from 'lucide-react';
import { PartMaster, InventoryItem, StockMovement, WarehouseLocation, Branch } from '../../types/erp';
import { useAuth } from '../../lib/authContext';

interface DashboardOverviewProps {
  parts: PartMaster[];
  inventory: InventoryItem[];
  movements: StockMovement[];
  locations: WarehouseLocation[];
  onOpenAddPart: () => void;
  onOpenScanner: () => void;
  onOpenMovementModal: (part?: PartMaster) => void;
  onSelectPart: (part: PartMaster) => void;
  onNavigateToParts: () => void;
  onNavigateToMovements: () => void;
  onNavigateToInventory: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  parts,
  inventory,
  movements,
  locations,
  onOpenAddPart,
  onOpenScanner,
  onOpenMovementModal,
  onSelectPart,
  onNavigateToParts,
  onNavigateToMovements,
  onNavigateToInventory
}) => {
  const { activeBranch, canViewFinancials, canEditParts, canPerformStockMovements } = useAuth();

  // Metrics calculations
  const totalParts = parts.length;
  const totalStockUnits = parts.reduce((sum, p) => sum + (p.totalStock || 0), 0);
  
  const totalValuationUSD = parts.reduce((sum, p) => sum + (p.totalStock * p.costPrice), 0);
  const totalRetailValuationUSD = parts.reduce((sum, p) => sum + (p.totalStock * p.sellingPrice), 0);

  // Conversion rate LYD estimation (1 USD ~ 4.85 LYD)
  const LYD_RATE = 4.85;
  const totalValuationLYD = totalValuationUSD * LYD_RATE;

  const lowStockParts = parts.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStock);
  const outOfStockParts = parts.filter((p) => p.totalStock === 0);
  const criticalCount = lowStockParts.length + outOfStockParts.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayMovements = movements.filter((m) => m.timestamp.startsWith(todayStr));

  // Category breakdown
  const categoryCounts: Record<string, { count: number; units: number; val: number }> = {};
  parts.forEach((p) => {
    const cat = p.categoryGroup || 'أخرى';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { count: 0, units: 0, val: 0 };
    }
    categoryCounts[cat].count += 1;
    categoryCounts[cat].units += p.totalStock;
    categoryCounts[cat].val += p.totalStock * p.sellingPrice;
  });

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
    <div className="space-y-8 pb-12 select-none">
      
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 lg:p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-white/5 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] border border-zinc-800 px-3.5 py-1 rounded-full text-zinc-400 font-medium">
              المركز التشغيلي: {activeBranch.name.split('—')[1] || activeBranch.name}
            </span>
            <span className="text-zinc-500 text-[10px] font-medium">• مزامنة فورية</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-light text-white tracking-tight leading-tight">
            لوحة التحكم والعمليات المخزنية
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-light tracking-wide max-w-xl">
            كتالوج قطع غيار مرسيدس-بنز الموحد، مصفوفة توزيع الأرفف والمخازن، وسجل الحركات اللوجستية.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center flex-wrap gap-3 relative z-10">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-white hover:text-black text-zinc-200 border border-white/10 hover:border-white rounded-full text-xs font-medium transition-all shadow-sm group"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition-colors" />
            <span className="text-[11px]">مسح باركود / QR</span>
          </button>

          {canPerformStockMovements && (
            <button
              onClick={() => onOpenMovementModal()}
              className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-white hover:text-black text-zinc-200 border border-white/10 hover:border-white rounded-full text-xs font-medium transition-all shadow-sm group"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition-colors" />
              <span className="text-[11px]">تسجيل حركة مخزنية</span>
            </button>
          )}

          {canEditParts && (
            <button
              onClick={onOpenAddPart}
              className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة قطعة مرسيدس</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Catalog Parts */}
        <div 
          onClick={onNavigateToParts}
          className="bg-[#111111] border border-white/10 hover:border-white/25 rounded-2xl p-6 cursor-pointer transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">إجمالي قطع الكتالوج</span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl text-white mt-3 group-hover:text-zinc-200 transition font-mono tracking-tight">
            {totalParts}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 pt-3 border-t border-white/5 font-light">
            <span>الرصيد الفعلي: <strong className="text-zinc-300 font-normal">{totalStockUnits} قطعة</strong></span>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">تقييم المخزون (التكلفة)</span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl text-white mt-3 font-mono tracking-tight">
            {canViewFinancials ? `$${totalValuationUSD.toLocaleString()}` : '••••••'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 pt-3 border-t border-white/5 font-light">
            <span>سعر البيع: <strong className="text-zinc-300 font-normal">{canViewFinancials ? `$${totalRetailValuationUSD.toLocaleString()}` : '••••'}</strong></span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {canViewFinancials ? `~${Math.round(totalValuationLYD).toLocaleString()} د.ل` : ''}
            </span>
          </div>
        </div>

        {/* Low & Critical Stock Alert */}
        <div 
          onClick={onNavigateToParts}
          className="bg-[#111111] border border-white/10 hover:border-white/25 rounded-2xl p-6 cursor-pointer transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">تنبيهات إعادة الطلب</span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl text-white mt-3 font-mono tracking-tight">
            {criticalCount} <span className="text-xs text-zinc-500 font-sans font-normal">صنف</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 pt-3 border-t border-white/5 font-light">
            <span>{outOfStockParts.length} نفد • {lowStockParts.length} منخفض</span>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>

        {/* Warehouse Bin Occupancy */}
        <div 
          onClick={onNavigateToInventory}
          className="bg-[#111111] border border-white/10 hover:border-white/25 rounded-2xl p-6 cursor-pointer transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">أرفف وخانات التخزين</span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl text-white mt-3 group-hover:text-zinc-200 transition font-mono tracking-tight">
            {locations.length} <span className="text-xs text-zinc-500 font-sans font-normal">خانة / رف</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-4 pt-3 border-t border-white/5 font-light">
            <span>المناطق: <strong className="text-zinc-300 font-normal">A, B, C, D</strong></span>
            <ChevronLeft className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>

      </div>

      {/* Main Content Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 spans): Category Breakdown & Critical Attention Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Critical Stock Attention List */}
          {criticalCount > 0 && (
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-white text-sm font-semibold">
                    قطع تتطلب إعادة الطلب الفوري وتجديد المخزون
                  </h3>
                </div>
                <button
                  onClick={onNavigateToParts}
                  className="text-xs text-zinc-400 hover:text-white font-medium transition"
                >
                  عرض الكل ({criticalCount}) ←
                </button>
              </div>

              <div className="space-y-2.5">
                {[...outOfStockParts, ...lowStockParts].slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPart(p)}
                    className="p-3.5 bg-[#141416] hover:bg-zinc-900 border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-white text-xs tracking-wider">
                          {p.partNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          p.totalStock === 0 ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {p.totalStock === 0 ? 'نفد المخزون' : `منخفض (${p.totalStock}/${p.minStock} حد أدنى)`}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 font-medium truncate mt-1">
                        {p.nameAr || p.nameEn}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-light truncate">
                        {p.nameEn}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMovementModal(p);
                        }}
                        className="px-3 py-1 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition shadow-sm"
                      >
                        استلام +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EPC Groups Distribution */}
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white text-sm font-semibold">
                  توزيع مجموعات كتالوج مرسيدس EPC
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-light">حجم المخزون الفعلي والقيمة التقديرية حسب المجموعات الميكانيكية</p>
              </div>
              <button
                onClick={onNavigateToParts}
                className="text-xs text-zinc-400 hover:text-white font-medium transition"
              >
                تصفح الكتالوج ←
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(categoryCounts).map(([catName, data]) => (
                <div
                  key={catName}
                  className="p-4 bg-[#141416] border border-white/5 hover:border-white/15 rounded-xl transition"
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-zinc-200 tracking-wide truncate">{catName}</span>
                    <span className="font-mono text-zinc-400 text-xs shrink-0">{data.count} صنف</span>
                  </div>
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden mb-2.5">
                    <div
                      className="bg-white h-1 rounded-full"
                      style={{ width: `${Math.min(100, (data.count / totalParts) * 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-light">
                    <span>الرصيد: <strong className="text-zinc-300 font-normal">{data.units} قطعة</strong></span>
                    <span className="font-mono">{canViewFinancials ? `$${data.val.toLocaleString()}` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (1 span): Recent Stock Movement Feed */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <h3 className="text-white text-sm font-semibold">
                  سجل حركة المخزون المباشر
                </h3>
              </div>
              <button
                onClick={onNavigateToMovements}
                className="text-xs text-zinc-400 hover:text-white font-medium transition"
              >
                السجل الكامل ←
              </button>
            </div>

            {movements.length === 0 ? (
              <div className="text-xs text-zinc-600 py-12 text-center font-light">
                لا توجد حركات مسجلة حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {movements.slice(0, 6).map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <div
                      key={m.id}
                      className="p-3 bg-[#141416] border border-white/5 rounded-xl text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium text-white text-xs tracking-wider">
                          {m.partNumber}
                        </span>
                        <span className={`font-mono px-2 py-0.5 rounded-full text-[10px] border ${
                          isPositive 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-200' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}>
                          {isPositive ? `+${m.quantity}` : m.quantity} قطعة
                        </span>
                      </div>

                      <div className="text-zinc-400 text-[11px] font-light truncate">
                        {m.partName}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-white/5">
                        <span className="font-medium text-zinc-400">
                          {getMovementTypeArabic(m.movementType)}
                        </span>
                        <span className="font-mono">
                          {m.destinationLocation ? `الرف ${m.destinationLocation}` : m.sourceLocation ? `الرف ${m.sourceLocation}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/10">
            <button
              onClick={() => onOpenMovementModal()}
              className="w-full py-2.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-200 rounded-full text-xs font-medium transition-all border border-white/10 hover:border-white flex items-center justify-center gap-2"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
              <span>تسجيل حركة مخزنية جديدة</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
