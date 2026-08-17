import React from 'react';
import { Building2, MapPin, Phone, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Branch } from '../../types/erp';
import { useAuth } from '../../lib/authContext';

interface BranchesManagementViewProps {
  branches: Branch[];
}

export const BranchesManagementView: React.FC<BranchesManagementViewProps> = ({
  branches
}) => {
  const { activeBranch, setActiveBranch } = useAuth();

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              شبكة فروع ومراكز التوزيع في ليبيا
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-white/10">
              {branches.length} فروع عاملة
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            فروع شركة أشرف وهشام في طرابلس، بنغازي، مصراتة، والمنطقة الحرة اللوجستية
          </p>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((b) => {
          const isActive = b.id === activeBranch.id;

          return (
            <div
              key={b.id}
              className={`p-6 rounded-2xl border transition shadow-sm space-y-4 ${
                isActive 
                  ? 'bg-[#141416] border-white/40 ring-1 ring-white/20' 
                  : 'bg-[#141416] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white text-base">{b.name}</h3>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0c0c0e] text-zinc-300 border border-white/10">
                        {b.code}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">{b.city}، ليبيا</p>
                  </div>
                </div>

                {isActive ? (
                  <span className="text-xs font-light text-white bg-white/10 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>الفرع النشط حالياً</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveBranch(b)}
                    className="text-xs font-medium text-zinc-300 bg-[#18181b] hover:bg-zinc-800 px-4 py-1.5 rounded-full border border-white/10 transition"
                  >
                    التبديل لهذا الفرع
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-zinc-400 font-light pt-3 border-t border-white/10">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>{b.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="font-mono">{b.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span className="font-mono">{b.email}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-zinc-500 font-light">
                <span>حالة الفرع: <strong className="text-emerald-400 font-medium font-mono text-xs">{b.status === 'ACTIVE' ? 'نشط ويعمل' : 'مغلق مؤقتاً'}</strong></span>
                <span className="text-xs text-zinc-500 font-mono">نظام أشرف وهشام الموحد</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
