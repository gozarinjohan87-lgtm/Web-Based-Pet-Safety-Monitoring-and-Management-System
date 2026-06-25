import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, AlertCircle, Search, X, ShieldCheck } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (petId: string) => void;
  onClose?: () => void;
  availablePetIds?: string[];
}

export default function QRScanner({
  onScanSuccess,
  onClose,
  availablePetIds = []
}: QRScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('manual');
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [manualId, setManualId] = useState<string>('');
  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      try {
        await qrReaderRef.current.stop();
      } catch (e) {
        console.error('Failed to stop QR camera scanner', e);
      }
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      await stopCamera();

      const reader = new Html5Qrcode('qr-scanner-element');
      qrReaderRef.current = reader;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraPermission(false);
        setError('No active camera devices detected. Please upload an image or use Ledger Pick.');
        return;
      }

      setCameraPermission(true);
      await reader.start(
        cameras[0].id,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        (decodedText) => {
          let petId = decodedText;
          if (decodedText.includes('?scan=')) {
            const url = new URL(decodedText);
            petId = url.searchParams.get('scan') || decodedText;
          }
          onScanSuccess(petId);
          stopCamera();
        },
        () => {
          // Continuous scanning, ignore verbose frame-by-frame errors
        }
      );
    } catch (err: any) {
      console.error(err);
      setCameraPermission(false);
      setError('Camera access denied or unsupported on this device. Please use manual or upload options.');
    }
  };

  const handleTabChange = (tab: 'camera' | 'upload' | 'manual') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'camera') {
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const parser = new Html5Qrcode('qr-scanner-hidden-element');
    
    parser.scanFile(file, true)
      .then(decodedText => {
        let petId = decodedText;
        if (decodedText.includes('?scan=')) {
          const url = new URL(decodedText);
          petId = url.searchParams.get('scan') || decodedText;
        }
        onScanSuccess(petId);
      })
      .catch(err => {
        console.error(err);
        setError('Unable to detect a valid QR Code tag from this image. Please ensure high clarity and good lighting.');
      });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setError('Please type or select a valid collar tag ID.');
      return;
    }
    onScanSuccess(manualId.trim());
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-lg w-full max-w-md mx-auto relative overflow-hidden">
      {onClose && (
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50 cursor-pointer transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="p-1 bg-amber-100 text-amber-800 rounded-md">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h3 className="font-display font-black text-stone-900 text-base">QR Collar Tag Scanner</h3>
        </div>
        <p className="text-xs text-stone-500">Scan pet collar identification tags for instant digital record access</p>
      </div>

      {/* Selector Tabs */}
      <div className="flex bg-stone-100 p-1 rounded-xl mb-4">
        <button
          onClick={() => handleTabChange('manual')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-amber-800 shadow-2xs'
              : 'text-stone-500 hover:text-stone-950'
          }`}
        >
          Ledger Pick
        </button>
        <button
          onClick={() => handleTabChange('camera')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-white text-amber-800 shadow-2xs'
              : 'text-stone-500 hover:text-stone-950'
          }`}
        >
          Camera Scan
        </button>
        <button
          onClick={() => handleTabChange('upload')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-amber-800 shadow-2xs'
              : 'text-stone-500 hover:text-stone-950'
          }`}
        >
          Upload Photo
        </button>
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 text-red-950 border border-red-200 rounded-xl mb-4 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden parsing container */}
      <div id="qr-scanner-hidden-element" className="hidden"></div>

      {/* Tab Contents */}
      {activeTab === 'camera' && (
        <div className="flex flex-col items-center justify-center py-2">
          <div
            id="qr-scanner-element"
            className="w-full max-w-[260px] h-[260px] rounded-2xl overflow-hidden bg-stone-950 relative border-2 border-amber-400"
          >
            {cameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-stone-900 text-xs p-4 text-center">
                <Camera className="h-10 w-10 text-amber-400 mb-2 animate-bounce" />
                <p>Requesting camera permission...</p>
              </div>
            )}
          </div>
          <p className="text-[10px] text-stone-400 mt-3 text-center">
            Align the collar tag QR code squarely within the frame.
          </p>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors p-6">
          <Upload className="h-10 w-10 text-amber-500 mb-2" />
          <p className="text-xs font-bold text-stone-700">Drag or select pet tag photograph</p>
          <p className="text-[10px] text-stone-400 mt-1">Accepts high resolution PNG, JPG, or JPEG</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="mt-4 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-[10px] font-bold text-stone-700 shadow-2xs cursor-pointer"
          >
            Select Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-4 py-1">
          {availablePetIds.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Active Registry Collar Tags:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-stone-150 rounded-xl bg-stone-50">
                {availablePetIds.map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setManualId(id);
                      onScanSuccess(id);
                    }}
                    className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 hover:bg-amber-200 active:bg-amber-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleManualSubmit}>
            <label className="text-[11px] font-bold text-stone-700 block mb-1">
              Collar QR ID Code Match
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. pet-102"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-250 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 rounded-xl text-xs font-bold text-stone-950 placeholder-stone-400 pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Scan ID
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
