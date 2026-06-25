import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  petId: string;
  petName: string;
  classification: 'Dog' | 'Cat';
  breed: string;
  disabled?: boolean;
}

export default function QRCodeGenerator({
  petId,
  petName,
  classification,
  breed,
  disabled = false
}: QRCodeGeneratorProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (disabled) return;
    
    // Generate QR with standard deep-linking or raw JSON details so mobile cameras can identify it easily!
    // In a real system, scanning this QR takes the user to the public lookup page for this pet.
    const urlPayload = `${window.location.origin}/?scan=${petId}`;
    
    QRCode.toDataURL(urlPayload, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1c1917', // Elegant charcoal
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrUrl(url);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to generate QR');
      });
  }, [petId, disabled]);

  const handleDownload = () => {
    if (!qrUrl) return;

    // Create a visual card to print as the actual collar tag!
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 550;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background card (Warm yellow and white accent)
    ctx.fillStyle = '#faf9f6';
    ctx.fillRect(0, 0, 400, 550);

    // Rounded yellow frame
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 12;
    ctx.strokeRect(15, 15, 370, 520);

    // Warm header banner
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(21, 21, 358, 80);

    // Title
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IROSIN, SORSOGON', 200, 55);
    ctx.font = '14px sans-serif';
    ctx.fillText('OFFICIAL PET REGISTRY', 200, 80);

    // Load QR image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = qrUrl;
    img.onload = () => {
      // Draw QR image in center
      ctx.drawImage(img, 72, 120, 256, 256);

      // Footer details
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(petName.toUpperCase(), 200, 420);

      ctx.fillStyle = '#4b5563';
      ctx.font = '16px sans-serif';
      ctx.fillText(`${classification} • ${breed}`, 200, 450);

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`ID: ${petId}`, 200, 485);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px sans-serif';
      ctx.fillText('Scan QR code to verify vaccination & health records', 200, 515);

      // Trigger download
      const link = document.createElement('a');
      link.download = `Irosin_Pet_Tag_${petName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  if (disabled) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 text-stone-500">
        <QrCode className="h-10 w-10 text-stone-300 mb-2" />
        <p className="text-sm font-medium text-center">QR Code Generation Disabled</p>
        <p className="text-xs text-stone-400 mt-1 text-center">Pending operator verification</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white border border-stone-200 rounded-2xl shadow-sm">
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : qrUrl ? (
        <div className="flex flex-col items-center">
          {/* Tag preview */}
          <div className="w-56 h-56 p-2 bg-white border-4 border-amber-400 rounded-xl flex items-center justify-center relative shadow-inner overflow-hidden">
            <img src={qrUrl} alt="Pet QR Code" className="w-full h-full object-contain" />
          </div>
          <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full mt-3">
            {petId}
          </span>
          <p className="text-xs text-stone-500 mt-1 text-center">
            Unique ID for {petName}
          </p>
          <button
            onClick={handleDownload}
            type="button"
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all w-full cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Download Collar Tag (PDF/PNG)
          </button>
        </div>
      ) : (
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-stone-200 h-10 w-10"></div>
        </div>
      )}
    </div>
  );
}
