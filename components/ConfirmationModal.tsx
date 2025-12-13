
import React from 'react';
import { LucideTrash2, LucideAlertCircle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    isDanger?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onClose, isDanger = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all scale-100 border border-slate-200" onClick={e => e.stopPropagation()}>
                <div className={`p-6 text-center ${isDanger ? 'bg-red-50' : 'bg-blue-50'}`}>
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isDanger ? <LucideTrash2 size={32} /> : <LucideAlertCircle size={32} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed px-2">{message}</p>
                </div>
                <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={() => { onConfirm(); onClose(); }} 
                        className={`flex-1 py-2.5 px-4 text-white rounded-xl font-bold text-sm shadow-lg transition-transform active:scale-95 ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        {isDanger ? 'Sí, Eliminar' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
