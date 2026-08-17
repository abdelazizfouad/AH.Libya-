import React, { useState } from 'react';
import { 
  Database, 
  RotateCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Car, 
  Building2, 
  Cpu,
  Boxes
} from 'lucide-react';
import { EpcCategory, PartMaster, WarehouseLocation, Branch } from '../../types/erp';
import { forceReseedDatabase } from '../../lib/firestoreService';

interface EpcSetupViewProps {
  categories: EpcCategory[];
  parts: PartMaster[];
  locations: WarehouseLocation[];
  branches: Branch[];
  onRefreshData: () => void;
}

export const EpcSetupView: React.FC<EpcSetupViewProps> = ({
  categories,
  parts,
  locations,
  branches,
  onRefreshData
}) => {
  const [isReseeding, setIsReseeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<string>('');

  const handleReseed = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إعادة تهيئة قاعدة البيانات ببيانات مرسيدس-بنز الأصلية ومواقع الأرفف والحركات؟')) {
      return;
    }

    setIsReseeding(true);
    setSeedStatus('جاري تهيئة وتحديث كتالوج EPC ومواقع المستودعات في Firestore...');
    try {
      await forceReseedDatabase();
      setSeedStatus('تمت تهيئة قاعدة البيانات بنجاح مع كافة قطع مرسيدس-بنز وتوزيع الأرفف!');
      onRefreshData();
    } catch (err: any) {
      console.error('Reseed error:', err);
      setSeedStatus(`خطأ أثناء تهيئة قاعدة البيانات: ${err.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              كتالوج EPC وإعدادات قاعدة البيانات
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-white/10">
              إدارة النظام
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            تصنيف مجموعات مرسيدس-بنز القياسية EPC، الفحص التشخيصي للنظام، وإدارة قاعدة بيانات Firestore السحابية
          </p>
        </div>

        <button
          onClick={handleReseed}
          disabled={isReseeding}
          className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-zinc-200 text-black rounded-full text-xs font-medium transition shadow-sm self-start sm:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
          <span>{isReseeding ? 'جاري الحفظ في Firestore...' : 'إعادة تهيئة البيانات التجريبية'}</span>
        </button>
      </div>

      {seedStatus && (
        <div className="p-4 bg-[#141416] border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-light">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{seedStatus}</span>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#141416] border border-white/10 rounded-2xl">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">القطع في الكتالوج</div>
          <div className="text-2xl font-light text-white mt-1 font-mono">{parts.length}</div>
          <div className="text-xs text-zinc-500 font-light mt-0.5">مع توافق الموديلات والشاسيه</div>
        </div>

        <div className="p-5 bg-[#141416] border border-white/10 rounded-2xl">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">أرفف ومواقع التخزين</div>
          <div className="text-2xl font-light text-white mt-1 font-mono">{locations.length}</div>
          <div className="text-xs text-zinc-500 font-light mt-0.5">أرفف معرفة بكود QR</div>
        </div>

        <div className="p-5 bg-[#141416] border border-white/10 rounded-2xl">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">مجموعات EPC الرئيسية</div>
          <div className="text-2xl font-light text-white mt-1 font-mono">{categories.length}</div>
          <div className="text-xs text-zinc-500 font-light mt-0.5">تصنيف دايملر الرسمي</div>
        </div>

        <div className="p-5 bg-[#141416] border border-white/10 rounded-2xl">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">محرك قاعدة البيانات</div>
          <div className="text-sm font-medium text-white mt-2.5 flex items-center gap-1.5 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Firestore Cloud</span>
          </div>
          <div className="text-xs text-zinc-500 font-light mt-0.5">عمليات ذرية مشفرة</div>
        </div>
      </div>

      {/* EPC Groups Taxonomy */}
      <div className="bg-[#141416] border border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-medium text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            <span>المجموعات الرئيسية لكتالوج مرسيدس-بنز EPC (Category Master)</span>
          </h2>
          <span className="text-xs text-zinc-500 font-light">معايير التصنيف الفني لشركة دايملر مرسيدس</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const count = parts.filter(p => p.categoryGroup === cat.nameEn).length;
            return (
              <div
                key={cat.id}
                className="p-4 bg-[#111111] border border-white/5 rounded-xl flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-400 text-xs">
                      {cat.code}
                    </span>
                    <span className="font-medium text-white text-xs">
                      {cat.nameAr || cat.nameEn}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-light mt-0.5">
                    {cat.nameEn}
                  </div>
                </div>

                <span className="text-xs font-mono px-2 py-0.5 bg-[#18181b] text-zinc-300 border border-white/10 rounded shrink-0">
                  {count} قطع
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
