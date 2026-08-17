import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Layers, 
  MapPin, 
  UserCheck, 
  FileText,
  Building2
} from 'lucide-react';
import { StockMovement, MovementType } from '../../types/erp';

interface MovementsLedgerViewProps {
  movements: StockMovement[];
  onOpenMovementModal: () => void;
}

const getMovementTypeArabic = (type: string) => {
  switch (type) {
    case 'INITIAL_STOCK': return 'رصيد افتتاحي';
    case 'PURCHASE': return 'استلام مشتريات';
    case 'SALE': return 'صرف مبيعات / فاتورة';
    case 'TRANSFER': return 'نقل بين الأرفف / الفروع';
    case 'ADJUSTMENT': return 'تسوية جرد دوري';
    case 'DAMAGED': return 'هالك / متضرر';
    case 'CUSTOMER_RETURN': return 'مرتجع عميل';
    default: return type.replace('_', ' ');
  }
};

export const MovementsLedgerView: React.FC<MovementsLedgerViewProps> = ({
  movements,
  onOpenMovementModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (selectedType !== 'ALL' && m.movementType !== selectedType) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNum = m.partNumber.toLowerCase().includes(term);
        const matchesName = m.partName.toLowerCase().includes(term);
        const matchesRef = (m.reference || '').toLowerCase().includes(term);
        const matchesUser = m.userName.toLowerCase().includes(term);
        const matchesReason = m.reason.toLowerCase().includes(term);
        if (!matchesNum && !matchesName && !matchesRef && !matchesUser && !matchesReason) return false;
      }
      return true;
    });
  }, [movements, searchTerm, selectedType]);

  const handleExportCSV = () => {
    const headers = ['التاريخ والوقت', 'رقم القطعة', 'اسم الصنف', 'نوع الحركة', 'الكمية', 'الرصيد السابق', 'الرصيد الجديد', 'موقع الرف', 'رقم المرجع / الفاتورة', 'السبب / البيان', 'المستخدم المسجل'];
    const rows = filteredMovements.map(m => [
      `"${m.timestamp}"`,
      `"${m.partNumber}"`,
      `"${m.partName}"`,
      `"${getMovementTypeArabic(m.movementType)}"`,
      m.quantity,
      m.previousQuantity,
      m.newQuantity,
      `"${m.destinationLocation || m.sourceLocation || 'غير محدد'}"`,
      `"${m.reference || ''}"`,
      `"${m.reason}"`,
      `"${m.userName}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجل_حركات_المخزون_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              سجل حركات المخزون والرقابة
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-white/10">
              {filteredMovements.length} حركة مسجلة
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            سجل تدقيق غير قابل للتعديل لجميع عمليات الإدخال والإخراج ونقل الأرفف وتسويات الجرد
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-full text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={onOpenMovementModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>تسجيل حركة مخزنية +</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#141416] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
        
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم القطعة، الوصف، رقم السند أو الفاتورة، اسم الموظف، أو السبب..."
            className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl pr-10 pl-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:border-white/40 font-medium"
          >
            <option value="ALL">جميع أنواع الحركات</option>
            <option value="INITIAL_STOCK">رصيد افتتاحي</option>
            <option value="PURCHASE">استلام مشتريات (توريد)</option>
            <option value="SALE">صرف مبيعات (فاتورة)</option>
            <option value="TRANSFER">نقل بين الأرفف / الفروع</option>
            <option value="ADJUSTMENT">تسوية جردية</option>
            <option value="DAMAGED">هالك / تالف</option>
            <option value="CUSTOMER_RETURN">مرتجع عميل</option>
          </select>
        </div>

      </div>

      {/* Ledger Table */}
      <div className="bg-[#141416] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-zinc-300">
            
            <thead className="bg-[#0c0c0e] text-xs font-semibold text-zinc-400 border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-medium">التاريخ والوقت</th>
                <th className="py-3.5 px-3 font-medium">رقم القطعة والصنف</th>
                <th className="py-3.5 px-3 font-medium">نوع الحركة</th>
                <th className="py-3.5 px-3 font-medium">الكمية والتأثير</th>
                <th className="py-3.5 px-3 font-medium">موقع الرف</th>
                <th className="py-3.5 px-3 font-medium">المرجع / السبب</th>
                <th className="py-3.5 px-4 text-left font-medium">المستخدم المسؤول</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-sans">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-light">
                    لا توجد حركات مخزنية مسجلة مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition">
                      
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleDateString('ar-LY')}{' '}
                        <span className="text-zinc-600">{new Date(m.timestamp).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>

                      {/* Part */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono text-xs uppercase tracking-wider text-white font-medium">
                          {m.partNumber}
                        </div>
                        <div className="text-zinc-400 text-xs truncate max-w-[220px] font-light">
                          {m.partName}
                        </div>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2.5 py-1 rounded text-xs font-medium bg-[#0c0c0e] text-zinc-300 border border-white/10">
                          {getMovementTypeArabic(m.movementType)}
                        </span>
                      </td>

                      {/* Delta */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className={`font-semibold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${m.quantity}` : m.quantity} قطعة
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          الرصيد: {m.previousQuantity} ← <strong className="text-zinc-300 font-normal">{m.newQuantity}</strong>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3 font-mono text-zinc-300 text-xs">
                        {m.destinationLocation ? (
                          <span className="text-white font-medium">{m.destinationLocation}</span>
                        ) : m.sourceLocation ? (
                          <span className="text-white font-medium">{m.sourceLocation}</span>
                        ) : (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-3 max-w-[240px]">
                        {m.reference && (
                          <div className="font-mono text-[11px] text-zinc-400">
                            مستند: {m.reference}
                          </div>
                        )}
                        <div className="text-zinc-300 text-xs truncate font-light" title={m.reason}>
                          {m.reason}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="font-medium text-white text-xs">
                          {m.userName}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {m.branchName ? m.branchName.split('—')[0] : 'الفرع الرئيسي'}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
};
