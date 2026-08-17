import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Warehouse as WhIcon, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Boxes
} from 'lucide-react';
import { Warehouse, WarehouseLocation, InventoryItem } from '../../types/erp';
import { useAuth } from '../../lib/authContext';

interface WarehouseManagementViewProps {
  warehouses: Warehouse[];
  locations: WarehouseLocation[];
  inventory: InventoryItem[];
}

export const WarehouseManagementView: React.FC<WarehouseManagementViewProps> = ({
  warehouses,
  locations,
  inventory
}) => {
  const { activeBranch } = useAuth();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || '');

  const activeWarehouse = warehouses.find(w => w.id === selectedWarehouseId) || warehouses[0];
  const whLocations = locations.filter(l => !l.warehouseId || l.warehouseId === activeWarehouse?.id);

  return (
    <div className="space-y-6 pb-12 select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-light text-white tracking-tight">
              البنية التحتية للمستودعات ومراكز التوزيع
            </h1>
            <span className="bg-[#18181b] text-zinc-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-white/10">
              {warehouses.length} مستودعات ومرافق
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-light mt-1">
            إدارة المستودعات، المناطق اللوجستية، الممرات، وسعة التخزين وتوزيع الأرفف في ليبيا
          </p>
        </div>
      </div>

      {/* Warehouse Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const locs = locations.filter(l => !l.warehouseId || l.warehouseId === wh.id);
          const isSelected = wh.id === selectedWarehouseId;

          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWarehouseId(wh.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition shadow-sm ${
                isSelected
                  ? 'bg-[#141416] border-white/40 ring-1 ring-white/20'
                  : 'bg-[#141416] border-white/10 hover:border-white/25'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/10 flex items-center justify-center text-white">
                  <WhIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0c0c0e] text-zinc-300 border border-white/10">
                  {wh.code}
                </span>
              </div>

              <h3 className="font-medium text-white text-base">{wh.name}</h3>
              <p className="text-xs text-zinc-400 font-light mt-0.5">{wh.address}، {wh.city}</p>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 font-light">
                <span>{locs.length} رف تخزين معرف</span>
                <span className="font-mono text-zinc-300 text-xs">{wh.type === 'MAIN_HUB' ? 'مركز لوجستي رئيسي' : 'مستودع فرعي'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warehouse Deep Details */}
      {activeWarehouse && (
        <div className="bg-[#141416] border border-white/10 rounded-2xl p-6 space-y-6 shadow-sm">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-medium text-white flex items-center gap-2">
                <span>{activeWarehouse.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-[#18181b] text-zinc-300 border border-white/10 rounded">
                  {activeWarehouse.code}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-light mt-1">
                الموقع الجغرافي: {activeWarehouse.address} ({activeWarehouse.city}) • هاتف التواصل اللوجستي: 0000 000 91 218+
              </p>
            </div>
          </div>

          {/* Zones Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              المناطق التخزينية والتوزيع الهندسي للأقسام
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { zone: 'A', title: 'المنطقة A — المحرك ونواقل الحركة', desc: 'مكونات المحركات، أعمدة الكامات، المكابس، مجموعات التيمن، والتيربو', aisles: 'الممرات 01 - 04' },
                { zone: 'B', title: 'المنطقة B — الشاسيه ونظام التعليق', desc: 'أذرع التحكم، المساعدين، أقراص الفرامل، البالونات الهوائية وعيدان التوجيه', aisles: 'الممرات 01 - 04' },
                { zone: 'C', title: 'المنطقة C — الهيكل الخارجي والإضاءة', desc: 'المصدات، المصابيح الأمامية والخلفية، المرايا، الرادياتيرات وشبكات الواجهة', aisles: 'الممرات 01 - 03' },
                { zone: 'D', title: 'المنطقة D — الكهرباء وعقول SAM', desc: 'وحدات التحكم SAM، الحساسات، الضفائر الكهربائية، شمعات الاحتراق والمرحلات', aisles: 'الممرات 01 - 02' }
              ].map((z) => {
                const count = whLocations.filter(l => l.zone === z.zone).length;
                return (
                  <div key={z.zone} className="p-4 bg-[#111111] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-white text-xs">منطقة {z.zone}</span>
                      <span className="text-xs font-mono px-2 py-0.5 bg-[#18181b] text-zinc-300 border border-white/10 rounded">
                        {count} رفوف
                      </span>
                    </div>
                    <div className="text-xs font-medium text-white">{z.title}</div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">{z.desc}</p>
                    <div className="text-xs text-zinc-500 font-mono pt-2 border-t border-white/5">
                      {z.aisles}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Storage Locations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                الأرفف التخزينية المعينة بالمستودع ({whLocations.length} رف)
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {whLocations.map(l => (
                <div key={l.id} className="p-3 bg-[#0c0c0e] border border-white/5 rounded-xl text-center">
                  <div className="font-mono font-medium text-white text-xs tracking-wider">{l.code}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">السعة: {l.capacity}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
