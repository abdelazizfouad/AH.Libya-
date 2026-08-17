import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Layers, 
  Download, 
  ArrowUpDown, 
  Eye, 
  ArrowLeftRight, 
  Edit3, 
  MapPin, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Tag,
  Sparkles
} from 'lucide-react';
import { PartMaster, InventoryItem, WarehouseLocation } from '../../types/erp';
import { useAuth } from '../../lib/authContext';

interface PartsMasterViewProps {
  parts: PartMaster[];
  inventory: InventoryItem[];
  locations: WarehouseLocation[];
  onSelectPart: (part: PartMaster) => void;
  onOpenAddPart: () => void;
  onOpenEditPart: (part: PartMaster) => void;
  onOpenMovementModal: (part: PartMaster) => void;
}

export const PartsMasterView: React.FC<PartsMasterViewProps> = ({
  parts,
  inventory,
  locations,
  onSelectPart,
  onOpenAddPart,
  onOpenEditPart,
  onOpenMovementModal
}) => {
  const { canEditParts, canPerformStockMovements, canViewFinancials } = useAuth();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedChassis, setSelectedChassis] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedQuality, setSelectedQuality] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'partNumber' | 'totalStock' | 'sellingPrice' | 'nameEn'>('partNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract distinct Chassis list
  const chassisList = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => {
      p.compatibility.forEach((c) => {
        if (c.chassis) set.add(c.chassis);
      });
    });
    return Array.from(set).sort();
  }, [parts]);

  // Extract distinct Category Groups
  const categoryGroups = useMemo(() => {
    const set = new Set<string>();
    parts.forEach((p) => {
      if (p.categoryGroup) set.add(p.categoryGroup);
    });
    return Array.from(set).sort();
  }, [parts]);

  // Filtered and Sorted Parts
  const filteredParts = useMemo(() => {
    return parts.filter((p) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = p.partNumber.toLowerCase().includes(term);
        const matchesEn = p.nameEn.toLowerCase().includes(term);
        const matchesAr = p.nameAr.toLowerCase().includes(term);
        const matchesBrand = p.brand.toLowerCase().includes(term);
        const matchesBarcode = (p.barcode || '').includes(term);
        const matchesSuperseded = p.supersededNumbers.some(sn => sn.toLowerCase().includes(term));
        const matchesAlt = p.alternativeNumbers.some(an => an.toLowerCase().includes(term));
        const matchesChassis = p.compatibility.some(c => c.chassis.toLowerCase().includes(term) || c.model.toLowerCase().includes(term));

        if (!matchesNum && !matchesEn && !matchesAr && !matchesBrand && !matchesBarcode && !matchesSuperseded && !matchesAlt && !matchesChassis) {
          return false;
        }
      }

      // Group filter
      if (selectedGroup !== 'ALL' && p.categoryGroup !== selectedGroup) {
        return false;
      }

      // Chassis filter
      if (selectedChassis !== 'ALL') {
        const hasChassis = p.compatibility.some(c => c.chassis === selectedChassis);
        if (!hasChassis) return false;
      }

      // Quality filter
      if (selectedQuality !== 'ALL' && p.quality !== selectedQuality) {
        return false;
      }

      // Stock Status filter
      if (selectedStatus === 'IN_STOCK' && p.totalStock <= 0) return false;
      if (selectedStatus === 'LOW_STOCK' && (p.totalStock <= 0 || p.totalStock > p.minStock)) return false;
      if (selectedStatus === 'OUT_OF_STOCK' && p.totalStock > 0) return false;

      return true;
    }).sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [parts, searchTerm, selectedGroup, selectedChassis, selectedStatus, selectedQuality, sortBy, sortOrder]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['رقم القطعة', 'الاسم بالعربي', 'الاسم بالإنجليزي', 'مجموعة EPC', 'الماركة', 'الجودة', 'المخزون الفعلي', 'سعر التكلفة USD', 'سعر البيع USD', 'الحد الأدنى'];
    const rows = filteredParts.map(p => [
      `"${p.partNumber}"`,
      `"${p.nameAr}"`,
      `"${p.nameEn}"`,
      `"${p.categoryGroup}"`,
      `"${p.brand}"`,
      `"${p.quality}"`,
      p.totalStock,
      p.costPrice,
      p.sellingPrice,
      p.minStock
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AHL_Mercedes_Parts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-light text-white tracking-tight">
              كتالوج وقطع غيار مرسيدس EPC
            </h1>
            <span className="text-[10px] border border-zinc-800 px-3 py-1 rounded-full text-zinc-400 font-mono">
              {filteredParts.length} قطعة
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-light tracking-wide">
            كتالوج مركزي موحد لقطع غيار مرسيدس-بنز مع بيانات EPC، التوافقية ومواقع الرفوف
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-white hover:text-black text-zinc-300 border border-white/10 hover:border-white rounded-full text-xs font-medium transition-all shadow-sm group"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black" />
            <span className="text-[11px]">تصدير CSV</span>
          </button>

          {canEditParts && (
            <button
              onClick={onOpenAddPart}
              className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition-all shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة رقم قطعة جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Multi-Filter Bar */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Primary Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث برقم القطعة (A2133230500)، الاسم العربي/الإنجليزي، الماركة، الشاسيه (W213)، الباركود..."
            className="w-full bg-[#141416] border border-white/10 focus:border-white/40 rounded-xl pr-11 pl-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none tracking-wide"
          />
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          
          {/* Category Group */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">
              مجموعة EPC
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-[#141416] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/30"
            >
              <option value="ALL">جميع المجموعات ({categoryGroups.length})</option>
              {categoryGroups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Chassis */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">
              شاسيه مرسيدس
            </label>
            <select
              value={selectedChassis}
              onChange={(e) => setSelectedChassis(e.target.value)}
              className="w-full bg-[#141416] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/30"
            >
              <option value="ALL">جميع موديلات الشاسيه</option>
              {chassisList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Status */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">
              حالة المخزون
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#141416] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/30"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="IN_STOCK">متوفر في المخزن</option>
              <option value="LOW_STOCK">مخزون منخفض (≤ الحد الأدنى)</option>
              <option value="OUT_OF_STOCK">نفد من المخزن (0)</option>
            </select>
          </div>

          {/* Quality / Brand */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">
              درجة الجودة
            </label>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full bg-[#141416] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/30"
            >
              <option value="ALL">جميع الدرجات</option>
              <option value="GENUINE_OEM">أصلي وكالة OEM</option>
              <option value="ORIGINAL">أصلي مرسيدس Original</option>
              <option value="AFTERMARKET">بديل معتمد Aftermarket</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-semibold text-zinc-400 mb-1.5">
              الترتيب حسب
            </label>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('_');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="w-full bg-[#141416] border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-white/30"
            >
              <option value="partNumber_asc">رقم القطعة (أ → ي)</option>
              <option value="totalStock_desc">المخزون: من الأعلى للأدنى</option>
              <option value="totalStock_asc">المخزون: من الأدنى للأعلى</option>
              <option value="sellingPrice_desc">السعر: من الأعلى للأدنى</option>
              <option value="nameEn_asc">الاسم (أ → ي)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Parts Table */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-zinc-300">
            
            {/* Table Header */}
            <thead className="bg-[#0c0c0e] text-[11px] font-medium text-zinc-400 border-b border-white/10">
              <tr>
                <th className="py-4 px-5">رقم القطعة والبيانات</th>
                <th className="py-4 px-4">مجموعة EPC والجودة</th>
                <th className="py-4 px-4">شاسيهات مرسيدس المتوافقة</th>
                <th className="py-4 px-4">موقع الرف الرئيسي</th>
                <th className="py-4 px-4">الرصيد المخزني</th>
                <th className="py-4 px-4 text-left">السعر</th>
                <th className="py-4 px-5 text-center">إجراءات</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/5">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-600 font-light">
                    لا توجد قطع غيار مطابقة لمعايير البحث والتصفية.
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const isLow = part.totalStock > 0 && part.totalStock <= part.minStock;
                  const isOut = part.totalStock === 0;

                  // Find inventory bins for this part
                  const partInvs = inventory.filter(inv => inv.partId === part.id && inv.quantity > 0);
                  const primaryBin = partInvs.length > 0 ? partInvs[0].locationCode : 'غير مخصص';

                  return (
                    <tr 
                      key={part.id}
                      onClick={() => onSelectPart(part)}
                      className="hover:bg-zinc-900/60 cursor-pointer transition-all group"
                    >
                      {/* Part Number & Titles */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3.5">
                          <div className="w-8 h-8 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 group-hover:border-white/30 transition">
                            MB
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium text-white text-sm tracking-wide">
                                {part.partNumber}
                              </span>
                              {part.supersededNumbers.length > 0 && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800" title={`يستبدل: ${part.supersededNumbers.join(', ')}`}>
                                  مستبدل
                                </span>
                              )}
                            </div>
                            <div className="text-zinc-100 font-medium text-xs mt-0.5">
                              {part.nameAr || part.nameEn}
                            </div>
                            <div className="text-zinc-500 text-[11px] font-light">
                              {part.nameEn}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* EPC Group & Quality */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-zinc-200">
                          {part.categoryGroup}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-light">
                          {part.brand}
                        </div>
                        <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400">
                          {getQualityLabel(part.quality)} • {getConditionLabel(part.condition)}
                        </span>
                      </td>

                      {/* Compatibility */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[180px]">
                          {part.compatibility.slice(0, 2).map((c, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-[#141416] text-zinc-400 border border-white/5 font-mono">
                              {c.chassis} ({c.model})
                            </span>
                          ))}
                          {part.compatibility.length > 2 && (
                            <span className="text-[10px] text-zinc-600 self-center">
                              +{part.compatibility.length - 2} موديلات
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Primary Bin Location */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-zinc-200">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{primaryBin}</span>
                        </div>
                        {partInvs.length > 1 && (
                          <div className="text-[10px] text-zinc-500 font-light mt-0.5">
                            +{partInvs.length - 1} رفوف إضافية
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-sm text-white">
                            {part.totalStock} {part.unit === 'PCS' ? 'قطعة' : part.unit}
                          </span>
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                              نفد
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px]">
                              منخفض
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]">
                              متوفر
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-light mt-1">
                          الحد الأدنى: {part.minStock} • نقطة الطلب: {part.reorderLevel}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 text-left">
                        <div className="font-mono font-medium text-white text-sm">
                          ${part.sellingPrice}
                        </div>
                        {canViewFinancials && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            التكلفة: ${part.costPrice}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectPart(part)}
                            title="عرض تفاصيل القطعة"
                            className="p-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-400 rounded-full border border-white/10 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canPerformStockMovements && (
                            <button
                              onClick={() => onOpenMovementModal(part)}
                              title="حركة مخزنية / تعديل الرصيد"
                              className="p-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-400 rounded-full border border-white/10 transition"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEditParts && (
                            <button
                              onClick={() => onOpenEditPart(part)}
                              title="تعديل بيانات القطعة"
                              className="p-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-400 rounded-full border border-white/10 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3.5 bg-[#0c0c0e] border-t border-white/10 flex items-center justify-between text-xs text-zinc-500 font-light">
          <span>عرض {filteredParts.length} من أصل {parts.length} قطعة مرسيدس مسجلة</span>
          <span>انقر على أي صف لفتح ملف القطعة الكامل وسجل أرفف التخزين</span>
        </div>

      </div>

    </div>
  );
};
