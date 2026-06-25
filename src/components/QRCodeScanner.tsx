import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, AlertCircle, FileText, X, Search } from 'lucide-react';

interface QRCodeScannerProps {
  onScanSuccess: (petId: string) => void;
  onClose?: () => void;
  availablePetIds?: string[]; // Quick list of active pets to easily select in office or field!
}

export default function QRCodeScanner({
  onScanSuccess,
  onClose,
  availablePetIds = []
}: QRCodeScannerProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('manual');
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [manualId, setManualId] = useState<string>('');
  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when component unmounts
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
        console.error('Failed to stop scanner camera', e);
      }
    }
  };

  const startCamera = async () => {
    setError('');
    try {
      // Clean up previous reader if any
      await stopCamera();

      const reader = new Html5Qrcode('qr-reader-container');
      qrReaderRef.current = reader;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setCameraPermission(false);
        setError('No camera devices detected. Please use the Upload File or Manual selection tab.');
        return;
      }

      setCameraPermission(true);
      // Start scanning on the first camera
      await reader.start(
        cameras[0].id,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 }
        },
        (decodedText) => {
          // Check if decodedText contains ?scan=
          let petId = decodedText;
          if (decodedText.includes('?scan=')) {
            const url = new URL(decodedText);
            petId = url.searchParams.get('scan') || decodedText;
          }
          onScanSuccess(petId);
          stopCamera();
        },
        (errorMessage) => {
          // Silent scan errors, they happen continuously during autofocus
        }
      );
    } catch (err: any) {
      console.error(err);
      setCameraPermission(false);
      setError('Camera access blocked or not supported. Please use the Upload File or Manual selection tab.');
    }
  };

  const handleTabChange = (tab: 'camera' | 'upload' | 'manual') => {
    setActiveTab(tab);
    setError('');
    if (tab === 'camera') {
      // Use settimeout to let DOM element render first
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }
  };

  // Upload file decode helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const html5QrCode = new Html5Qrcode('qr-reader-container-hidden');
    
    html5QrCode.scanFile(file, true)
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
        setError('Could not decode QR code from this image. Please ensure it is a clear image of the pet collar tag QR.');
      });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) {
      setError('Please provide or select a valid ID.');
      return;
    }
    onScanSuccess(manualId.trim());
  };

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-lg w-full max-w-md mx-auto relative overflow-hidden">
      {onClose && (
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-50 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      )}

      <div className="mb-4">
        <h3 className="font-display font-bold text-lg text-stone-900">QR Scanner Device</h3>
        <p className="text-xs text-stone-500">Scan pet tags in the field for instant verification & logs</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 p-1.5 rounded-xl mb-4">
        <button
          onClick={() => handleTabChange('manual')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Ledger Pick
        </button>
        <button
          onClick={() => handleTabChange('camera')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'camera'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Live Camera
        </button>
        <button
          onClick={() => handleTabChange('upload')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-amber-700 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Upload Tag
        </button>
      </div>

      {/* Error Panel */}
      {error && (
        <div className="flex gap-2 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl mb-4 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden container used to parse uploads */}
      <div id="qr-reader-container-hidden" className="hidden"></div>

      {/* Tab Contents */}
      {activeTab === 'camera' && (
        <div className="flex flex-col items-center justify-center py-4">
          <div
            id="qr-reader-container"
            className="w-full max-w-[280px] h-[280px] rounded-2xl overflow-hidden bg-stone-950 relative border-2 border-amber-400"
          >
            {cameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-stone-900 text-xs p-4 text-center">
                <Camera className="h-10 w-10 text-amber-400 mb-2 animate-bounce" />
                <p>Requesting camera permission...</p>
              </div>
            )}
          </div>
          <p className="text-[11px] text-stone-400 mt-3 text-center">
            Position the tag QR code within the scanning zone.
          </p>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 hover:bg-stone-100 transition-colors p-6">
          <Upload className="h-10 w-10 text-amber-500 mb-2" />
          <p className="text-sm font-medium text-stone-700">Drag or upload tag photo</p>
          <p className="text-xs text-stone-400 mt-1">Supports PNG, JPG, JPEG formats</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            type="button"
            className="mt-4 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700 shadow-xs cursor-pointer"
          >
            Choose Image
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
        <div className="py-2">
          {availablePetIds.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium text-stone-500 block mb-2">
                Active Registry Collar Tags:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-stone-100 rounded-xl bg-stone-50">
                {availablePetIds.map(id => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setManualId(id);
                      onScanSuccess(id);
                    }}
                    className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 active:bg-amber-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleManualSubmit}>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Manually Enter Pet ID Code
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. pet-001"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-400 rounded-xl text-sm font-semibold text-stone-950 placeholder-stone-400 pl-9"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Scan/Search
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
