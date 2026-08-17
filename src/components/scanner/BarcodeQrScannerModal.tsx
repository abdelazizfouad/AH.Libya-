import React, { useState } from 'react';
import { 
  QrCode, 
  Barcode, 
  Search, 
  X, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  MapPin, 
  Boxes,
  Sparkles
} from 'lucide-react';
import { PartMaster, WarehouseLocation, InventoryItem } from '../../types/erp';

interface BarcodeQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: PartMaster[];
  locations: WarehouseLocation[];
  inventory: InventoryItem[];
  onSelectPart: (part: PartMaster) => void;
  onSelectLocation: (location: WarehouseLocation) => void;
}

export const BarcodeQrScannerModal: React.FC<BarcodeQrScannerModalProps> = ({
  isOpen,
  onClose,
  parts,
  locations,
  inventory,
  onSelectPart,
  onSelectLocation
}) => {
  const [scanInput, setScanInput] = useState('');
  const [scanMode, setScanMode] = useState<'AUTO' | 'PART' | 'LOCATION'>('AUTO');
  const [lastScannedResult, setLastScannedResult] = useState<{
    type: 'PART' | 'LOCATION' | 'NOT_FOUND';
    part?: PartMaster;
    location?: WarehouseLocation;
    locationParts?: InventoryItem[];
    code: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleScan = (codeToScan: string) => {
    const raw = codeToScan.trim();
    if (!raw) return;

    const normalized = raw.toUpperCase();

    // 1. Check if it matches a Part (Part Number, Barcode, or QR)
    const matchedPart = parts.find(
      (p) =>
        p.partNumber.toUpperCase() === normalized ||
        (p.barcode && p.barcode === raw) ||
        (p.qrCode && p.qrCode.toUpperCase() === normalized) ||
        p.alternativeNumbers.some((a) => a.toUpperCase() === normalized)
    );

    if (matchedPart) {
      setLastScannedResult({
        type: 'PART',
        part: matchedPart,
        code: raw
      });
      return;
    }

    // 2. Check if it matches a Location Code
    const matchedLocation = locations.find(
      (l) => l.code.toUpperCase() === normalized || l.id === raw
    );

    if (matchedLocation) {
      const partsInLoc = inventory.filter((inv) => inv.locationId === matchedLocation.id || inv.locationCode === matchedLocation.code);
      setLastScannedResult({
        type: 'LOCATION',
        location: matchedLocation,
        locationParts: partsInLoc,
        code: raw
      });
      return;
    }

    // 3. Not found
    setLastScannedResult({
      type: 'NOT_FOUND',
      code: raw
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl bg-[#111111] border border-white/10 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0c0e]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center text-white">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-white text-base">
                ماسح الباركود ورمز الاستجابة السريعة (QR Code)
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                مسح ملصقات قطع الغيار أو كود الأرفف والمواقع التخزينية بالمستودع
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Scanner Simulation Viewfinder */}
          <div className="relative aspect-video max-h-52 w-full bg-[#0c0c0e] rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center p-4 overflow-hidden group">
            {/* Animated Laser line */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse top-1/2 -translate-y-1/2 w-full" />

            <div className="relative z-10 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs font-light">
                <Camera className="w-4 h-4 text-white animate-bounce" />
                <span>القارئ البصري نشط / جاهز لقراءة الباركود أو رمز QR</span>
              </div>
              <p className="text-xs text-zinc-500 font-light">
                يمكنك استخدام قارئ الباركود اليدوي، كاميرا الهاتف، أو الإدخال اليدوي المباشر
              </p>
            </div>
          </div>

          {/* Manual Input or Scanner Feed */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleScan(scanInput);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Barcode className="w-5 h-5 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="امسح أو اكتب رقم القطعة (مثل A2133230500) أو كود الرف (مثل A-03-02-07)..."
                className="w-full bg-[#0c0c0e] border border-white/10 text-white rounded-xl pr-11 pl-4 py-2.5 text-xs focus:outline-none focus:border-white/40 font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-medium text-xs rounded-xl transition"
            >
              بحث / مسح
            </button>
          </form>

          {/* Quick Click-to-Test Barcode Presets */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>نماذج تجريبية سريعة (محاكاة فورية):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setScanInput('A2133230500');
                  handleScan('A2133230500');
                }}
                className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition"
              >
                قطعة: A2133230500 (مقص أمامي)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanInput('A2054210012');
                  handleScan('A2054210012');
                }}
                className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition"
              >
                قطعة: A2054210012 (ديسك فرامل)
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanInput('A-03-02-07');
                  handleScan('A-03-02-07');
                }}
                className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition"
              >
                رف تخزين: A-03-02-07
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanInput('B-01-02-04');
                  handleScan('B-01-02-04');
                }}
                className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-300 transition"
              >
                رف تخزين: B-01-02-04
              </button>
            </div>
          </div>

          {/* Scan Result Card */}
          {lastScannedResult && (
            <div className="mt-4 p-5 rounded-2xl border bg-[#141416] border-white/10 space-y-4 animate-fadeIn">
              
              {/* Part Found */}
              {lastScannedResult.type === 'PART' && lastScannedResult.part && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم التعرف على قطعة غيار مرسيدس-بنز بنجاح</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      الكود: {lastScannedResult.code}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white text-base tracking-wider uppercase font-semibold">
                          {lastScannedResult.part.partNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-[#18181b] text-zinc-300 font-mono border border-white/10">
                          {lastScannedResult.part.quality === 'GENUINE_OEM' ? 'أصلي وكالة OEM' : 'مطابق للأصلي OEM-MATCH'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white">
                        {lastScannedResult.part.nameAr || lastScannedResult.part.nameEn}
                      </div>
                      <div className="text-xs text-zinc-400 font-light">
                        {lastScannedResult.part.nameEn}
                      </div>
                      <div className="text-xs text-zinc-400 font-light mt-1">
                        المجموعة: <strong className="text-zinc-200 font-normal">{lastScannedResult.part.categoryGroup}</strong>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-xs text-zinc-500 font-mono">الرصيد المتاح</div>
                      <div className="text-lg font-mono text-white mt-0.5">
                        {lastScannedResult.part.totalStock} {lastScannedResult.part.unit}
                      </div>
                      <div className="text-xs text-zinc-300 font-mono font-medium mt-0.5">
                        ${lastScannedResult.part.sellingPrice}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        onSelectPart(lastScannedResult.part!);
                        onClose();
                      }}
                      className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-medium text-xs rounded-full transition"
                    >
                      فتح بطاقة الصنف الكاملة ←
                    </button>
                  </div>
                </div>
              )}

              {/* Location Found */}
              {lastScannedResult.type === 'LOCATION' && lastScannedResult.location && (
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم التعرف على موقع رف التخزين بالمستودع</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-500">
                      الكود: {lastScannedResult.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-mono text-white text-base font-semibold tracking-wider">
                        {lastScannedResult.location.code}
                      </div>
                      <div className="text-xs text-zinc-400 font-light mt-0.5">
                        المنطقة {lastScannedResult.location.zone} • الممر {lastScannedResult.location.aisle} • الحامل {lastScannedResult.location.shelf} • الرف {lastScannedResult.location.bin}
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs bg-[#18181b] px-2.5 py-1 rounded-full text-zinc-300 border border-white/10 font-mono">
                        السعة القصوى: {lastScannedResult.location.capacity} قطعة
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    القطع المخزنة في هذا الرف ({lastScannedResult.locationParts?.length || 0}):
                  </div>

                  {lastScannedResult.locationParts && lastScannedResult.locationParts.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {lastScannedResult.locationParts.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-[#0c0c0e] border border-white/5 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono text-white ml-2">
                              {item.partNumber}
                            </span>
                            <span className="text-zinc-400 font-light">{item.partNameAr || item.partNameEn}</span>
                          </div>
                          <span className="font-mono text-zinc-300 bg-[#18181b] px-2 py-0.5 rounded text-xs border border-white/10">
                            {item.quantity} قطعة
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 italic p-3 bg-[#0c0c0e] rounded-xl border border-white/5 font-light">
                      هذا الرف فارغ حالياً وجاهز لتخصيص بضاعة جديدة.
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        onSelectLocation(lastScannedResult.location!);
                        onClose();
                      }}
                      className="px-5 py-2 bg-white hover:bg-zinc-200 text-black font-medium text-xs rounded-full transition"
                    >
                      معاينة الرف في شاشة خريطة المخزون ←
                    </button>
                  </div>
                </div>
              )}

              {/* Not Found */}
              {lastScannedResult.type === 'NOT_FOUND' && (
                <div className="text-center py-5 space-y-2">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <div className="text-sm font-medium text-white">
                    لم يتم العثور على رمز الباركود أو الـ QR: "{lastScannedResult.code}"
                  </div>
                  <p className="text-xs text-zinc-400 font-light max-w-sm mx-auto">
                    تأكد من صحة رقم القطعة أو تأكد من تعريف كود الرف التخزيني مسبقاً في قاعدة البيانات.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0c0c0e] border-t border-white/10 text-xs text-zinc-500 flex items-center justify-between">
          <span className="font-mono text-xs">صيغة EPC QR القياسية لمرسيدس: <code className="text-zinc-300">MB-PART-[PART_NUMBER]</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-white/10 rounded-full text-xs font-medium transition"
          >
            إغلاق الماسح
          </button>
        </div>

      </div>
    </div>
  );
};
