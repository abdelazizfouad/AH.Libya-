import React, { useState, useEffect } from 'react';
import { 
  X, 
  Layers, 
  Car, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  MapPin, 
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  PartMaster, 
  VehicleCompatibility, 
  PartCondition, 
  PartQuality, 
  WarehouseLocation, 
  Branch, 
  Warehouse, 
  EpcCategory 
} from '../../types/erp';
import { useAuth } from '../../lib/authContext';
import { createPart, updatePart, recommendOptimalBinLocation } from '../../lib/firestoreService';

interface AddEditPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  partToEdit?: PartMaster | null;
  categories: EpcCategory[];
  locations: WarehouseLocation[];
  warehouses: Warehouse[];
  branches: Branch[];
  onSuccess: (partId: string) => void;
}

export const AddEditPartModal: React.FC<AddEditPartModalProps> = ({
  isOpen,
  onClose,
  partToEdit,
  categories,
  locations,
  warehouses,
  branches,
  onSuccess
}) => {
  const { currentUser, activeBranch } = useAuth();
  const isEditing = !!partToEdit;

  // Form State
  const [partNumber, setPartNumber] = useState('');
  const [originalPartNumber, setOriginalPartNumber] = useState('');
  const [supersededInput, setSupersededInput] = useState('');
  const [alternativeInput, setAlternativeInput] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [categoryGroup, setCategoryGroup] = useState('01 ENGINE & TIMING');
  const [subgroup, setSubgroup] = useState('');
  const [epcIllustration, setEpcIllustration] = useState('');
  const [epcPosition, setEpcPosition] = useState('');
  const [brand, setBrand] = useState('Mercedes-Benz Genuine Parts');
  const [quality, setQuality] = useState<PartQuality>('GENUINE_OEM');
  const [condition, setCondition] = useState<PartCondition>('NEW');
  const [side, setSide] = useState<'LEFT' | 'RIGHT' | 'BOTH' | 'N/A'>('N/A');
  const [position, setPosition] = useState<'FRONT' | 'REAR' | 'UPPER' | 'LOWER' | 'CENTER' | 'N/A'>('N/A');
  const [unit, setUnit] = useState('PCS');
  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(160);
  const [wholesalePrice, setWholesalePrice] = useState<number>(140);
  const [minStock, setMinStock] = useState<number>(2);
  const [maxStock, setMaxStock] = useState<number>(20);
  const [reorderLevel, setReorderLevel] = useState<number>(3);
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  // Compatibility List
  const [compatibilityList, setCompatibilityList] = useState<VehicleCompatibility[]>([
    { chassis: 'W213', model: 'E200 / E300', engine: 'M274', yearFrom: 2016, yearTo: 2023 }
  ]);

  // Initial Stock Allocation (only for new parts)
  const [allocateInitialStock, setAllocateInitialStock] = useState<boolean>(true);
  const [initialQuantity, setInitialQuantity] = useState<number>(5);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (partToEdit) {
      setPartNumber(partToEdit.partNumber);
      setOriginalPartNumber(partToEdit.originalPartNumber || '');
      setSupersededInput(partToEdit.supersededNumbers.join(', '));
      setAlternativeInput(partToEdit.alternativeNumbers.join(', '));
      setNameEn(partToEdit.nameEn);
      setNameAr(partToEdit.nameAr);
      setDescription(partToEdit.description || '');
      setCategoryGroup(partToEdit.categoryGroup);
      setSubgroup(partToEdit.subgroup || '');
      setEpcIllustration(partToEdit.epcIllustration || '');
      setEpcPosition(partToEdit.epcPosition || '');
      setBrand(partToEdit.brand);
      setQuality(partToEdit.quality);
      setCondition(partToEdit.condition);
      setSide(partToEdit.side || 'N/A');
      setPosition(partToEdit.position || 'N/A');
      setUnit(partToEdit.unit);
      setCostPrice(partToEdit.costPrice);
      setSellingPrice(partToEdit.sellingPrice);
      setWholesalePrice(partToEdit.wholesalePrice || partToEdit.sellingPrice);
      setMinStock(partToEdit.minStock);
      setMaxStock(partToEdit.maxStock);
      setReorderLevel(partToEdit.reorderLevel);
      setBarcode(partToEdit.barcode || '');
      setNotes(partToEdit.notes || '');
      setCompatibilityList(partToEdit.compatibility || []);
      setAllocateInitialStock(false);
    } else {
      // Reset form
      setPartNumber('');
      setOriginalPartNumber('');
      setSupersededInput('');
      setAlternativeInput('');
      setNameEn('');
      setNameAr('');
      setDescription('');
      setCategoryGroup(categories[0]?.nameEn || '01 ENGINE & TIMING');
      setSubgroup('');
      setEpcIllustration('');
      setEpcPosition('');
      setBrand('Mercedes-Benz Genuine Parts');
      setQuality('GENUINE_OEM');
      setCondition('NEW');
      setCostPrice(100);
      setSellingPrice(160);
      setWholesalePrice(140);
      setMinStock(2);
      setMaxStock(20);
      setReorderLevel(3);
      setBarcode('');
      setNotes('');
      setCompatibilityList([{ chassis: 'W213', model: 'E200 / E300', engine: 'M274', yearFrom: 2016, yearTo: 2023 }]);
      setAllocateInitialStock(true);
      setInitialQuantity(5);
    }
  }, [partToEdit, categories, isOpen]);

  // Set default recommended location when location list changes
  useEffect(() => {
    if (!selectedLocationId && locations.length > 0) {
      const rec = recommendOptimalBinLocation(categoryGroup, locations, []);
      if (rec) setSelectedLocationId(rec.id);
      else setSelectedLocationId(locations[0].id);
    }
  }, [categoryGroup, locations, selectedLocationId]);

  if (!isOpen) return null;

  // Add compatibility row
  const addCompatibilityRow = () => {
    setCompatibilityList([
      ...compatibilityList,
      { chassis: 'W205', model: 'C200 / C300', engine: 'M274', yearFrom: 2014, yearTo: 2021 }
    ]);
  };

  const removeCompatibilityRow = (idx: number) => {
    setCompatibilityList(compatibilityList.filter((_, i) => i !== idx));
  };

  const updateCompatibilityRow = (idx: number, field: keyof VehicleCompatibility, value: any) => {
    const updated = [...compatibilityList];
    updated[idx] = { ...updated[idx], [field]: value };
    setCompatibilityList(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPartNumber = partNumber.trim().toUpperCase();
    if (!cleanPartNumber) {
      setErrorMsg('رقم قطعة مرسيدس مطلوب (مثال: A2133230500).');
      return;
    }

    if (!nameEn.trim()) {
      setErrorMsg('اسم القطعة بالإنجليزية مطلوب.');
      return;
    }

    if (!nameAr.trim()) {
      setErrorMsg('اسم القطعة بالعربية مطلوب (مثال: مقص أمامي سفلي).');
      return;
    }

    const supersededArr = supersededInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const altArr = alternativeInput.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    setLoading(true);

    try {
      if (isEditing && partToEdit) {
        await updatePart(partToEdit.id, {
          partNumber: cleanPartNumber,
          originalPartNumber: originalPartNumber.trim().toUpperCase() || cleanPartNumber,
          supersededNumbers: supersededArr,
          alternativeNumbers: altArr,
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          description: description.trim(),
          categoryGroup,
          subgroup,
          epcIllustration,
          epcPosition,
          brand,
          quality,
          condition,
          side,
          position,
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          wholesalePrice: Number(wholesalePrice),
          minStock: Number(minStock),
          maxStock: Number(maxStock),
          reorderLevel: Number(reorderLevel),
          barcode: barcode.trim() || cleanPartNumber,
          qrCode: `MB-PART-${cleanPartNumber}`,
          notes: notes.trim(),
          compatibility: compatibilityList
        }, {
          id: currentUser.id,
          name: currentUser.displayName
        });

        onSuccess(partToEdit.id);
      } else {
        // Create new Part
        let initialAlloc;
        if (allocateInitialStock && initialQuantity > 0 && selectedLocationId) {
          const loc = locations.find(l => l.id === selectedLocationId);
          if (loc) {
            initialAlloc = {
              branchId: activeBranch.id,
              branchName: activeBranch.name,
              warehouseId: loc.warehouseId,
              warehouseName: loc.warehouseName || 'المستودع الرئيسي',
              locationId: loc.id,
              locationCode: loc.code,
              quantity: Number(initialQuantity),
              user: {
                id: currentUser.id,
                name: currentUser.displayName
              }
            };
          }
        }

        const newId = await createPart({
          partNumber: cleanPartNumber,
          originalPartNumber: originalPartNumber.trim().toUpperCase() || cleanPartNumber,
          supersededNumbers: supersededArr,
          alternativeNumbers: altArr,
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          description: description.trim(),
          categoryGroup,
          subgroup,
          epcIllustration,
          epcPosition,
          brand,
          quality,
          condition,
          side,
          position,
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          wholesalePrice: Number(wholesalePrice),
          minStock: Number(minStock),
          maxStock: Number(maxStock),
          reorderLevel: Number(reorderLevel),
          barcode: barcode.trim() || cleanPartNumber,
          qrCode: `MB-PART-${cleanPartNumber}`,
          notes: notes.trim(),
          compatibility: compatibilityList
        }, initialAlloc);

        onSuccess(newId);
      }

      onClose();
    } catch (err: any) {
      console.error('Error saving part:', err);
      setErrorMsg(err.message || 'فشل حفظ بيانات القطعة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="w-full max-w-4xl bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center text-white font-bold text-sm">
              MB
            </div>
            <div>
              <h2 className="font-medium text-white text-base">
                {isEditing ? `تعديل صنف: ${partToEdit?.partNumber}` : 'إضافة رقم قطعة مرسيدس-بنز جديد'}
              </h2>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                تسجيل الصنف في كتالوج EPC Master وتحديد التوافقية وموقع الرف بالمخزن
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identification */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 border-b border-white/10 pb-2">
              ١. تعريف القطعة وأرقام المطابقة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  رقم قطعة مرسيدس الرئيسي *
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="مثال: A2133230500"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase tracking-wider"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  رقم الكتالوج الأصلي / SKU
                </label>
                <input
                  type="text"
                  value={originalPartNumber}
                  onChange={(e) => setOriginalPartNumber(e.target.value)}
                  placeholder="مثال: A2133230500"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  الباركود (EAN-13 / UPC)
                </label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="مثال: 4047437482910"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono tracking-wider"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  الاسم بالإنجليزي (English Name) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Front Left Lower Control Arm (Wishbone)"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  الاسم بالعربي *
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: مقص أمامي سفلي يسار أصلي"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white"
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  أرقام قطع مستبدلة وبدائل مرسيدس (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={supersededInput}
                  onChange={(e) => setSupersededInput(e.target.value)}
                  placeholder="مثال: A2133230100, A2133230300"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">
                  أرقام متطابقة من شركات أخرى (مفصولة بفواصل)
                </label>
                <input
                  type="text"
                  value={alternativeInput}
                  onChange={(e) => setAlternativeInput(e.target.value)}
                  placeholder="مثال: LEM-3945801, TRW-JTC2291"
                  className="w-full bg-[#0c0c0e] border border-white/10 focus:border-white/40 rounded-xl px-3.5 py-2.5 text-white font-mono uppercase tracking-wider"
                />
              </div>
            </div>
          </div>

          {/* Section 2: EPC Classification & Quality */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 border-b border-white/10 pb-2">
              ٢. تصنيف EPC والمصنع ودرجة الجودة
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">مجموعة EPC</label>
                <select
                  value={categoryGroup}
                  onChange={(e) => setCategoryGroup(e.target.value)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.nameEn}>{c.nameAr || c.nameEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">الشركة المصنعة</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="مثال: Lemförder, Brembo, Bosch"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">درجة الجودة</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value as any)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                >
                  <option value="GENUINE_OEM">أصلي وكالة (OEM)</option>
                  <option value="ORIGINAL">أصلي مرسيدس Genuine</option>
                  <option value="AFTERMARKET">بديل تجاري معتمد Aftermarket</option>
                  <option value="REMANUFACTURED">مجدد معتمد Reman</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">الحالة</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                >
                  <option value="NEW">جديد بالكرتونة</option>
                  <option value="USED">مستعمل بحالة ممتازة</option>
                  <option value="REFURBISHED">مجدد</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">الجانب</label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as any)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                >
                  <option value="N/A">غير محدد</option>
                  <option value="LEFT">يسار (Left)</option>
                  <option value="RIGHT">يمين (Right)</option>
                  <option value="BOTH">الجهتين (طقم Both)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">الموضع</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:border-white/40"
                >
                  <option value="N/A">غير محدد</option>
                  <option value="FRONT">أمامي (Front)</option>
                  <option value="REAR">خلفي (Rear)</option>
                  <option value="UPPER">علوي (Upper)</option>
                  <option value="LOWER">سفلي (Lower)</option>
                  <option value="CENTER">أوسط (Center)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">رقم مخطط EPC</label>
                <input
                  type="text"
                  value={epcIllustration}
                  onChange={(e) => setEpcIllustration(e.target.value)}
                  placeholder="مثال: 32-050"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">رقم الموضع على المخطط</label>
                <input
                  type="text"
                  value={epcPosition}
                  onChange={(e) => setEpcPosition(e.target.value)}
                  placeholder="مثال: 10"
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Stock Parameters */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-300 border-b border-white/10 pb-2">
              ٣. الأسعار ومحددات المخزون
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">سعر التكلفة ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">سعر البيع قطاعي ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">سعر الجملة / الورش ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-400 text-xs mb-1">الحد الأدنى للطلب</label>
                <input
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">نقطة إعادة الطلب</label>
                <input
                  type="number"
                  min="0"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1">الحد الأقصى للسعة</label>
                <input
                  type="number"
                  min="0"
                  value={maxStock}
                  onChange={(e) => setMaxStock(Number(e.target.value))}
                  className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Vehicle Compatibility Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-xs font-semibold text-zinc-300">
                ٤. مصفوفة توافق موديلات السيارات ({compatibilityList.length})
              </h3>
              <button
                type="button"
                onClick={addCompatibilityRow}
                className="px-3.5 py-1.5 bg-[#18181b] hover:bg-white hover:text-black text-zinc-300 border border-white/10 rounded-full text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة موديل سيارة +</span>
              </button>
            </div>

            <div className="space-y-2">
              {compatibilityList.map((comp, idx) => (
                <div key={idx} className="p-3 bg-[#141416] border border-white/5 rounded-xl flex items-center gap-2">
                  <div className="w-24">
                    <input
                      type="text"
                      placeholder="الشاسيه (W213)"
                      value={comp.chassis}
                      onChange={(e) => updateCompatibilityRow(idx, 'chassis', e.target.value.toUpperCase())}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase"
                    />
                  </div>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="الموديل (E200 / E300)"
                      value={comp.model}
                      onChange={(e) => updateCompatibilityRow(idx, 'model', e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="text"
                      placeholder="المحرك (M274)"
                      value={comp.engine || ''}
                      onChange={(e) => updateCompatibilityRow(idx, 'engine', e.target.value.toUpperCase())}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="من سنة"
                      value={comp.yearFrom || ''}
                      onChange={(e) => updateCompatibilityRow(idx, 'yearFrom', Number(e.target.value))}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="إلى سنة"
                      value={comp.yearTo || ''}
                      onChange={(e) => updateCompatibilityRow(idx, 'yearTo', Number(e.target.value))}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  {compatibilityList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompatibilityRow(idx)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Initial Stock Allocation (New Parts Only) */}
          {!isEditing && (
            <div className="space-y-3 bg-[#141416] p-4 border border-white/10 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="allocStock"
                    checked={allocateInitialStock}
                    onChange={(e) => setAllocateInitialStock(e.target.checked)}
                    className="w-4 h-4 accent-white rounded"
                  />
                  <label htmlFor="allocStock" className="text-xs font-medium text-white cursor-pointer">
                    تخصيص رصيد افتتاحي أولي في موقع الرف بالمستودع
                  </label>
                </div>
                <span className="text-[11px] text-zinc-400">ينشئ حركة استلام تلقائية</span>
              </div>

              {allocateInitialStock && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">
                      الكمية الافتتاحية (قطعة)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(Number(e.target.value))}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs mb-1">
                      تحديد رف التخزين
                    </label>
                    <select
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                      className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-white/40"
                    >
                      {locations.map(l => (
                        <option key={l.id} value={l.id}>
                          الرف: {l.code} (المنطقة {l.zone} • {l.notes || 'موقع تخزين'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 rounded-full font-medium transition border border-white/10 text-xs"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-full font-medium transition shadow-sm flex items-center gap-2 text-xs"
            >
              {loading ? (
                <span>جاري الحفظ في النظام...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'حفظ تعديلات القطعة' : 'تسوية وحفظ الصنف الجديد'}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
