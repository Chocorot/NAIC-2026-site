"use client";

import { HiOutlineExclamation, HiOutlineX } from "react-icons/hi";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText,
  cancelText,
  type = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              type === "danger" 
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" 
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
            }`}>
              <HiOutlineExclamation className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>
          
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              id="confirm-button"
              onClick={onConfirm}
              className={`flex-1 py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all active:scale-95 ${
                type === "danger"
                  ? "bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-none"
              }`}
            >
              {confirmText}
            </button>
            <button
              id="cancel-button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              {cancelText}
            </button>
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
