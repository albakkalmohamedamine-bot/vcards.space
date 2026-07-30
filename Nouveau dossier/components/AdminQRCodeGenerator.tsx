'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Image as ImageIcon, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface AdminQRCodeGeneratorProps {
  slug: string;
  logoUrl?: string;
  qrLogoEnabled: boolean;
  onToggleQrLogo: (enabled: boolean) => void;
  themeColor?: string;
  businessName?: string;
}

export const AdminQRCodeGenerator: React.FC<AdminQRCodeGeneratorProps> = ({
  slug,
  logoUrl,
  qrLogoEnabled,
  onToggleQrLogo,
  themeColor = '#1B2A4A',
  businessName = 'Business',
}) => {
  const [origin, setOrigin] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const highResContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicCardUrl = slug ? `${origin}/card/${slug}` : `${origin}/card/demo`;

  // Provide brief visual loading feedback when slug, logo, or logo toggle changes
  useEffect(() => {
    setIsGenerating(true);
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [slug, qrLogoEnabled, logoUrl]);

  const handleDownloadHighRes = async () => {
    try {
      setIsDownloading(true);
      setDownloadSuccess(false);

      // Allow DOM to settle for high-res canvas element
      await new Promise((resolve) => setTimeout(resolve, 100));

      const highResCanvas = highResContainerRef.current?.querySelector('canvas') as HTMLCanvasElement;
      if (!highResCanvas) {
        throw new Error('High-resolution canvas not ready');
      }

      // Convert to high-quality PNG data URL
      const dataUrl = highResCanvas.toDataURL('image/png', 1.0);

      // Trigger automatic browser download
      const link = document.createElement('a');
      const safeSlug = slug || 'business';
      link.download = `${safeSlug}-qr-code-1000px.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to download QR code PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const hasLogo = Boolean(logoUrl && logoUrl.trim().length > 0);

  return (
    <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${themeColor}40`, border: `1px solid ${themeColor}60` }}
          >
            <QrCode className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Generate QR Code
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Admin Exclusive
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-resolution scannable QR code linked to your public digital card.
            </p>
          </div>
        </div>
      </div>

      {/* Main QR Work Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* QR Preview Box */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div 
            id="admin-qr-preview-box"
            ref={previewCanvasRef}
            className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col items-center justify-center min-w-[220px] min-h-[220px] group transition-all"
          >
            {isGenerating ? (
              <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Generating QR...</span>
              </div>
            ) : (
              <QRCodeCanvas
                value={publicCardUrl}
                size={200}
                level="H" // High error correction (30%) for logo embedding safety
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                includeMargin={true}
                imageSettings={
                  qrLogoEnabled && hasLogo
                    ? {
                        src: logoUrl!,
                        height: 44,
                        width: 44,
                        excavate: true,
                      }
                    : undefined
                }
              />
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-2.5 truncate max-w-full px-2">
            Target: {publicCardUrl}
          </span>
        </div>

        {/* Controls & Options */}
        <div className="md:col-span-7 space-y-4">
          {/* Logo Embed Toggle */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Embed Logo in Center</span>
                  <span className="text-[11px] text-slate-400 block">
                    Overlays your business logo with high error-correction level (30%)
                  </span>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={qrLogoEnabled}
                onClick={() => onToggleQrLogo(!qrLogoEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  qrLogoEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    qrLogoEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {!hasLogo && qrLogoEnabled && (
              <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Upload a logo in the form above to display it in the center of the QR code.</span>
              </div>
            )}
          </div>

          {/* Download Action Button */}
          <div>
            <button
              type="button"
              onClick={handleDownloadHighRes}
              disabled={isDownloading || isGenerating}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Generating High-Res PNG (1024x1024)...
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  QR Code PNG Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download High-Res Print PNG (1000px+)
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2 font-mono">
              Exported as 1024x1024px lossless PNG, suitable for high quality printing on NFC cards, banners, or flyers.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden 1024x1024 High-Res Canvas Element for Print Export */}
      <div ref={highResContainerRef} className="hidden" aria-hidden="true">
        <QRCodeCanvas
          value={publicCardUrl}
          size={1024}
          level="H"
          bgColor="#FFFFFF"
          fgColor="#0F172A"
          includeMargin={true}
          imageSettings={
            qrLogoEnabled && hasLogo
              ? {
                  src: logoUrl!,
                  height: 235,
                  width: 235,
                  excavate: true,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};
