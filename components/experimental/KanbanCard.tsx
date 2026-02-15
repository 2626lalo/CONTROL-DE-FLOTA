import React from 'react';
import { LucideClock, LucideMessageSquare, LucideMaximize2, LucideUser, LucideCar } from 'lucide-react';
import { ServiceRequest } from '../../types';
import { format, parseISO, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale/es';

interface Props {
  request: ServiceRequest;
  onClick: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

export const KanbanCard: React.FC<Props> = ({ request, onClick, onDragStart }) => {
  const slaHours = differenceInHours(new Date(), parseISO(request.createdAt));
  
  const getPriorityStyles = (p: string) => {
    switch (p) {
      case 'URGENTE': return 'bg-rose-500 text-white shadow-rose-200';
      case 'ALTA': return 'bg-amber-500 text-white shadow-amber-200';
      case 'MEDIA': return 'bg-blue-500 text-white shadow-blue-200';
      default: return 'bg-slate-300 text-slate-700 shadow-slate-100';
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, request.id)}
      onClick={() => onClick(request.id)}
      className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-400 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
    >
      {/* Indicador de Prioridad Lateral */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        request.priority === 'URGENTE' ? 'bg-rose-500' :
        request.priority === 'ALTA' ? 'bg-amber-500' :
        request.priority === 'MEDIA' ? 'bg-blue-500' : 'bg-slate-300'
      }`}></div>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 uppercase leading-none">{request.code}</span>
          {request.priority === 'URGENTE' && <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>}
        </div>
        <div className="flex gap-2">
          {request.messages?.length > 0 && (
            <div className="flex items-center gap-1 text-slate-300 group-hover:text-blue-500 transition-colors">
              <LucideMessageSquare size={10}/>
              <span className="text-[8px] font-black">{request.messages.length}</span>
            </div>
          )}
          <LucideMaximize2 size={12} className="text-slate-200 group-hover:text-slate-400 transition-colors"/>
        </div>
      </div>

      <h4 className="text-2xl font-black text-slate-800 italic uppercase leading-none mb-1 group-hover:text-blue-600 transition-colors tracking-tighter">
        {request.vehiclePlate}
      </h4>
      <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-4 italic">
        {request.specificType || request.mainCategory}
      </p>
      
      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[9px] font-black uppercase shrink-0">
            {request.userName?.charAt(0)}
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[100px]">{request.userName?.split(' ')[0]}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <LucideClock size={10}/>
          <span className="text-[8px] font-black uppercase">{slaHours} HS SLA</span>
        </div>
      </div>
    </div>
  );
};