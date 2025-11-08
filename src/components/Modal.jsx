import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 py-6">
      <div className="relative w-full max-w-lg rounded-xl bg-slate-800 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition hover:text-slate-200"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {title && <h2 className="mb-4 text-xl font-semibold text-slate-100">{title}</h2>}
        <div className="text-slate-200">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
