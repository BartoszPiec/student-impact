"use client";

import { createPortal } from "react-dom";
import { X, ShieldAlert } from "lucide-react";

interface SecureImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  fileName: string;
}

export function SecureImageViewer({
  isOpen,
  onClose,
  url,
  fileName,
}: SecureImageViewerProps) {
  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    return false;
  };

  const handleDragStart = (event: React.DragEvent) => {
    event.preventDefault();
    return false;
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 text-white/90">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium drop-shadow-md">
            Tryb Bezpiecznego Podgladu
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-110 pointer-events-auto shadow-lg shadow-red-500/20"
          aria-label={`Zamknij podglad pliku ${fileName}`}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div
        className="relative max-w-[95vw] max-h-[90vh] overflow-hidden rounded-lg shadow-2xl select-none"
        onContextMenu={handleContextMenu}
        onClick={(event) => event.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`Podglad pliku ${fileName}`}
          className="max-w-full max-h-[85vh] object-contain pointer-events-none selection-none"
          onDragStart={handleDragStart}
        />

        <div className="absolute inset-0 z-10 pointer-events-none flex flex-wrap content-start items-start opacity-20 overflow-hidden mix-blend-overlay">
          {Array.from({ length: 20 }).map((_, index) => (
            <div
              key={index}
              className="w-[200px] h-[200px] flex items-center justify-center -rotate-45 transform"
            >
              <span className="text-xl font-black text-white uppercase whitespace-nowrap">
                WZOR • PREVIEW
              </span>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center opacity-30 mix-blend-screen">
          <span className="text-6xl md:text-9xl font-black text-white/50 -rotate-12 uppercase tracking-widest border-4 border-white/20 p-8 rounded-3xl backdrop-blur-[2px]">
            PODGLAD
          </span>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white/70 text-xs z-30 pointer-events-none">
          Pobieranie i zrzuty ekranu sa zablokowane
        </div>
      </div>
    </div>,
    document.body
  );
}
