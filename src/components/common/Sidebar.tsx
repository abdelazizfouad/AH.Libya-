import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Boxes, 
  ArrowLeftRight, 
  Warehouse, 
  Building2, 
  FileText, 
  RotateCcw, 
  ShieldCheck,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';

export type NavView = 
  | 'dashboard'
  | 'parts'
  | 'inventory'
  | 'movements'
  | 'warehouses'
  | 'branches'
  | 'audit'
  | 'system';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  lowStockCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  lowStockCount
}) => {
  const { isSuperAdmin, canAccessAuditLogs } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'لوحة التحكم والمؤشرات',
      labelEn: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'parts' as NavView,
      label: 'كتالوج وقطع غيار مرسيدس',
      labelEn: 'EPC & Parts Master',
      icon: Layers,
      badge: lowStockCount > 0 ? `${lowStockCount} ناقص` : null,
      badgeType: 'warning'
    },
    {
      id: 'inventory' as NavView,
      label: 'المخازن ومواقع الأرفف',
      labelEn: 'Bin Locations & Stock',
      icon: Boxes,
      badge: null
    },
    {
      id: 'movements' as NavView,
      label: 'سجل الحركات والأذونات',
      labelEn: 'Stock Movements Ledger',
      icon: ArrowLeftRight,
      badge: null
    },
    {
      id: 'warehouses' as NavView,
      label: 'المستودعات والمناطق',
      labelEn: 'Warehouses & Zones',
      icon: Warehouse,
      badge: null
    },
    {
      id: 'branches' as NavView,
      label: 'الفروع ومراكز التوزيع',
      labelEn: 'Branches & Hubs',
      icon: Building2,
      badge: null
    }
  ];

  if (canAccessAuditLogs) {
    navItems.push({
      id: 'audit' as NavView,
      label: 'سجل تدقيق العمليات',
      labelEn: 'Security & Audit Logs',
      icon: ShieldCheck,
      badge: null,
      badgeType: undefined
    });
  }

  navItems.push({
    id: 'system' as NavView,
    label: 'إعدادات النظام والبيانات',
    labelEn: 'EPC Setup & Seeder',
    icon: RotateCcw,
    badge: null,
    badgeType: undefined
  });

  return (
    <aside className="w-64 shrink-0 bg-[#09090b] border-l border-white/10 text-zinc-400 flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16 select-none">
      
      {/* Navigation List */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-3 text-[10px] uppercase text-zinc-500 font-semibold">
          العمليات وإدارة المخزون
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView.toLowerCase() === item.id.toLowerCase();

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.1)]'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-zinc-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 ${
                  isActive 
                    ? 'bg-black text-white' 
                    : 'border border-zinc-800 text-zinc-400 bg-zinc-900/60'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom EPC Info Box */}
      <div className="p-4 m-3 bg-[#111111] rounded-2xl border border-white/10 text-xs shadow-2xl">
        <div className="flex items-center gap-2 text-white font-bold text-xs mb-1.5">
          <Tag className="w-3.5 h-3.5 text-zinc-400" />
          <span>كتالوج مرسيدس-بنز EPC</span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed font-light">
          المعرف الأساسي: <strong className="text-zinc-300 font-mono">رقم القطعة (A...)</strong>. نظام تتبع مواقع الأرفف المتعددة مفعل.
        </p>
      </div>

    </aside>
  );
};
