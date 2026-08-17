import React from 'react';
import { 
  Search, 
  QrCode, 
  PlusCircle, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  ShieldAlert,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';

interface HeaderProps {
  onOpenGlobalSearch: () => void;
  onOpenScanner: () => void;
  onOpenAddPart: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGlobalSearch,
  onOpenScanner,
  onOpenAddPart,
  activeView
}) => {
  const { currentUser, activeBranch, allBranches, allDemoUsers, switchUser, switchBranch, canEditParts } = useAuth();

  const getRoleArabic = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'المدير العام / المسؤول';
      case 'ADMIN': return 'مدير النظام';
      case 'WAREHOUSE':
      case 'WAREHOUSE_MANAGER': return 'مدير المخازن والأرفف';
      case 'SALES':
      case 'SALES_SPECIALIST': return 'أخصائي مبيعات EPC';
      case 'PURCHASING':
      case 'PURCHASER': return 'مسؤول المشتريات والتوريد';
      case 'ACCOUNTING': return 'المحاسب المالي';
      default: return role;
    }
  };

  return (
    <header className="bg-[#050505]/95 backdrop-blur-md border-b border-white/10 text-[#D4D4D8] sticky top-0 z-30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Active Branch */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#111111] border border-white/20 shadow-inner font-serif font-bold text-sm text-white tracking-widest shrink-0">
              MB
            </div>
            <div className="hidden sm:block min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wide text-white text-sm truncate">
                  أشرف وهشام
                </span>
                <span className="text-[10px] border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
                  ليبيا ERP
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-light truncate">قطع غيار مرسيدس-بنز الأصلية</p>
            </div>
          </div>

          {/* Center Search Bar trigger */}
          <div className="flex-1 max-w-md mx-2">
            <button
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-4 py-2 bg-[#111111] hover:bg-zinc-900/90 border border-white/10 hover:border-white/20 rounded-full text-zinc-400 hover:text-zinc-200 text-xs transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
                <span className="truncate tracking-wide">ابحث برقم القطعة (A2133230500)، الشاسيه (W213)، أو الرف...</span>
              </div>
              <kbd className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono bg-black/60 text-zinc-400 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            
            {/* Barcode / QR Scanner Button */}
            <button
              onClick={onOpenScanner}
              title="فتح قارئ الباركود و QR"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111111] hover:bg-white hover:text-black text-zinc-300 text-xs font-medium rounded-full border border-white/10 hover:border-white transition-all shadow-sm group"
            >
              <QrCode className="w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition-colors" />
              <span className="hidden lg:inline text-[11px]">مسح باركود</span>
            </button>

            {/* Quick Add Part (if permitted) */}
            {canEditParts && (
              <button
                onClick={onOpenAddPart}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-medium rounded-full transition-all shadow-[0_4px_20px_rgba(255,255,255,0.12)]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">إضافة قطعة</span>
              </button>
            )}

            {/* Branch Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-full text-xs font-medium text-zinc-300 transition">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden md:inline max-w-[120px] truncate">{activeBranch.name.split('—')[1] || activeBranch.name}</span>
                <span className="md:hidden font-mono">{activeBranch.code}</span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
              
              <div className="absolute left-0 mt-2 w-64 bg-[#0e0e11] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] py-1.5 z-50 hidden group-hover:block group-focus-within:block animate-fadeIn backdrop-blur-xl">
                <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 border-b border-white/10">
                  الفروع ومراكز التوزيع
                </div>
                {allBranches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => switchBranch(b.id)}
                    className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition ${
                      b.id === activeBranch.id ? 'bg-white/10 text-white font-medium' : 'text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-zinc-200 truncate">{b.name}</div>
                      <div className="text-[10px] text-zinc-500">{b.city} ({b.code})</div>
                    </div>
                    {b.id === activeBranch.id && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* User Role Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 bg-[#111111] hover:bg-zinc-800 border border-white/10 hover:border-white/20 rounded-full text-xs text-zinc-300 transition">
                <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 text-white font-bold flex items-center justify-center text-xs">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden xl:block text-right pl-1">
                  <div className="text-xs font-medium text-zinc-200 leading-tight truncate max-w-[110px]">
                    {currentUser.displayName.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    {getRoleArabic(currentUser.role)}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-500 ml-1" />
              </button>

              <div className="absolute left-0 mt-2 w-72 bg-[#0e0e11] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] py-1.5 z-50 hidden group-hover:block group-focus-within:block animate-fadeIn backdrop-blur-xl">
                <div className="px-3.5 py-3 border-b border-white/10">
                  <p className="text-xs font-medium text-white">{currentUser.displayName}</p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{currentUser.email}</p>
                  <span className="inline-block mt-2 text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-zinc-300 font-medium">
                    الصلاحية: {getRoleArabic(currentUser.role)}
                  </span>
                </div>
                
                <div className="px-3.5 py-1.5 text-[10px] font-semibold text-zinc-500 border-b border-white/10">
                  تبديل المستخدم أو الصلاحية
                </div>
                
                {allDemoUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u.id)}
                    className={`w-full text-right px-3.5 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition ${
                      u.id === currentUser.id ? 'bg-white/10 text-white font-medium' : 'text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{u.displayName}</div>
                      <div className="text-[10px] text-zinc-500">{getRoleArabic(u.role)} — {u.email}</div>
                    </div>
                    {u.id === currentUser.id && <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
