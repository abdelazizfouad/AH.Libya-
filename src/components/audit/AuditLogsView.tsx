import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, FileText, Download } from 'lucide-react';
import { AuditLog } from '../../types/erp';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

const getActionArabic = (action: string) => {
  switch (action) {
    case 'CREATE_PART': return 'إضافة قطعة جديدة';
    case 'UPDATE_PART': return 'تعديل بيانات قطعة';
    case 'STOCK_MOVEMENT': return 'حركة مخزنية';
    case 'CREATE_LOCATION': return 'إنشاء موقع رف';
    case 'SYSTEM_SEED': return 'تهيئة أولية للنظام';
    default: return action;
  }
};

const getEntityArabic = (entity: string) => {
  switch (entity) {
    case 'PART': return 'قطعة غيار';
    case 'STOCK_MOVEMENT': return 'حركة مخزنية';
    case 'LOCATION': return 'موقع رف';
    case 'SYSTEM': return 'النظام';
    default: return entity;
  }
};

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (selectedAction !== 'ALL' && l.action !== selectedAction) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesAction = l.action.toLowerCase().includes(term);
        const matchesEntity = l.entityType.toLowerCase().includes(term);
        const matchesUser = l.userName.toLowerCase().includes(term);
        const matchesDetails = JSON.stringify(l.details || {}).toLowerCase().includes(term);
        if (!matchesAction && !matchesEntity && !matchesUser && !matchesDetails) return false;
      }
      return true;
    });
  }, [logs, searchTerm, selectedAction]);

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              سجل التدقيق الأمني والرقابة التشغيلية
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-white/10">
              {filteredLogs.length} حدث مسجل
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            سجل مراقبة فوري غير قابل للتعديل يتتبع إضافة وتعديل القطع، حركات الأرفف، صلاحيات المستخدمين، والعمليات
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-[#141416] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في سجل العمليات باسم الموظف، نوع الحدث، الكيان، أو البيانات..."
            className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:border-white/40 font-medium"
          >
            <option value="ALL">جميع أنواع الأحداث</option>
            <option value="CREATE_PART">إضافة قطعة جديدة</option>
            <option value="UPDATE_PART">تعديل بيانات قطعة</option>
            <option value="STOCK_MOVEMENT">حركة مخزنية</option>
            <option value="CREATE_LOCATION">إنشاء موقع رف</option>
            <option value="SYSTEM_SEED">تهيئة النظام الأولية</option>
          </select>
        </div>
      </div>

      {/* Audit Log Stream */}
      <div className="bg-[#141416] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-zinc-300">
            <thead className="bg-[#0c0c0e] text-xs font-semibold text-zinc-400 border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-normal">التاريخ والوقت</th>
                <th className="py-3.5 px-3 font-normal">نوع الحدث</th>
                <th className="py-3.5 px-3 font-normal">الكيان المتأثر</th>
                <th className="py-3.5 px-3 font-normal">المستخدم المنفذ</th>
                <th className="py-3.5 px-4 text-left font-normal">بيانات الحمولة (Payload)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-light">
                    لا توجد سجلات تدقيق مطابقة لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('ar-LY')}{' '}
                      <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString('ar-LY')}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-block px-2.5 py-1 rounded font-medium text-xs bg-[#18181b] text-zinc-300 border border-white/10">
                        {getActionArabic(log.action)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-white">{getEntityArabic(log.entityType)}</div>
                      <div className="font-mono text-xs text-zinc-500">{log.entityId}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-medium text-white">{log.userName}</div>
                      <div className="text-xs text-zinc-500 font-mono">معرف: {log.userId}</div>
                    </td>

                    <td className="py-3.5 px-4 text-left" dir="ltr">
                      <pre className="inline-block text-[11px] font-mono bg-[#0c0c0e] p-1.5 rounded-lg border border-white/5 text-zinc-400 max-w-xs truncate text-left">
                        {JSON.stringify(log.details || {})}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
