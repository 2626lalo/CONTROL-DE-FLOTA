
import React from 'react';
import { LucideAlertCircle, LucideCalendar, LucideDollarSign, LucideWrench, LucideCheckCircle2, LucideZap } from 'lucide-react';
import { ServiceRequest, ServiceStage } from '../../types';
import { KanbanCard } from './KanbanCard';

interface Props {
  requests: ServiceRequest[];
  onSelect: (id: string) => void;
  onMove: (id: string, newStage: ServiceStage) => void;
  role: string;
}

const COLUMNS = [
  { id: ServiceStage.REQUESTED, label: 'Solicitado', color: 'blue', icon: LucideAlertCircle },
  { id: ServiceStage.SCHEDULING, label: 'Turno Asignado', color: 'amber', icon: LucideCalendar },
  { id: ServiceStage.BUDGETING, label: 'Presupuestado', color: 'purple', icon: LucideDollarSign },
  { id: ServiceStage.IN_WORKSHOP, label: 'En Taller', color: 'indigo', icon: LucideWrench },
  { id: ServiceStage.FINISHED, label: 'Finalizado', color: 'emerald', icon: LucideCheckCircle2 },
];

export const KanbanBoard: React.FC<Props> = ({ requests, onSelect, onMove, role }) => {
  const canMove = role === 'ADMIN' || role === 'SUPERVISOR';

  const handleDragOver = (e: React.DragEvent) => {
    if (!canMove) return;
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canMove) return;
    e.dataTransfer.setData('requestId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    if (!canMove) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('requestId');
    if (id) {
      onMove(id, newStage as ServiceStage);
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-12 custom-scrollbar min-h-[70vh] px-4 -mx-4">
      {COLUMNS.map(col => {
        const colItems = requests.filter(r => r.stage === col.id);
        const Icon = col.icon;
        
        return (
          <div 
            key={col.id} 
            className="min-w-[340px] w-[340px] flex flex-col gap-5"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`flex justify-between items-center px-6 bg-white py-5 rounded-[2rem] shadow-sm border border-slate-100 border-l-[10px] transition-all sticky top-0 z-20`} style={{ borderLeftColor: `var(--tw-color-${col.color}-500)` }}>
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-${col.color}-50 text-${col.color}-600 shadow-inner`}>
                  <Icon size={18}/>
                </div>
                <div>
                  <h3 className="font-black text-[12px] uppercase tracking-widest text-slate-700 italic leading-none">{col.label}</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">{colItems.length} TICKETS</p>
                </div>
              </div>
              <span className="bg-slate-900 text-white px-3.5 py-1 rounded-full text-[10px] font-black shadow-lg shadow-slate-100">{colItems.length}</span>
            </div>

            <div className="flex-1 space-y-5 p-2 bg-slate-50/30 rounded-[3rem] min-h-[500px] transition-colors hover:bg-slate-100/50">
              {colItems.map(item => (
                <KanbanCard 
                  key={item.id} 
                  request={item} 
                  onClick={onSelect} 
                  onDragStart={handleDragStart}
                />
              ))}

              {colItems.length === 0 && (
                <div className="h-40 border-4 border-dashed border-slate-200/50 rounded-[3rem] flex flex-col items-center justify-center opacity-10 transition-all">
                  <LucideZap size={48}/>
                  <p className="text-[9px] font-black uppercase mt-3 tracking-[0.3em]">Cola Vacía</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
