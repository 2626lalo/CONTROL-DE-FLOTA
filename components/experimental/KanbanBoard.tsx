import React from 'react';
import { LucideAlertCircle, LucideCalendar, LucideDollarSign, LucideWrench, LucideCheckCircle2, LucideZap, LucideChevronDown, LucideChevronUp } from 'lucide-react';
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
  // Estado para colapsar columnas en móvil
  const [expandedCol, setExpandedCol] = React.useState<string | null>(null);

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
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:overflow-x-auto pb-12 md:custom-scrollbar min-h-[70vh] md:px-4 md:-mx-4 px-2">
      {COLUMNS.map(col => {
        const colItems = requests.filter(r => r.stage === col.id);
        const Icon = col.icon;
        const isExpanded = expandedCol === col.id || colItems.length > 0;
        
        return (
          <div 
            key={col.id} 
            className={`w-full md:min-w-[340px] md:w-[340px] flex flex-col gap-3 md:gap-5 transition-all duration-300`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div 
              onClick={() => setExpandedCol(expandedCol === col.id ? null : col.id)}
              className={`flex justify-between items-center px-4 md:px-6 bg-white py-3 md:py-5 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-100 border-l-[8px] md:border-l-[10px] transition-all md:sticky top-0 z-20 cursor-pointer md:cursor-default`} 
              style={{ borderLeftColor: `var(--tw-color-${col.color}-500)` }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`p-2 md:p-2.5 rounded-xl bg-${col.color}-50 text-${col.color}-600 shadow-inner`}>
                  <Icon size={16} className="md:w-[18px] md:h-[18px]"/>
                </div>
                <div>
                  <h3 className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-slate-700 italic leading-none">{col.label}</h3>
                  <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase mt-1 tracking-widest">{colItems.length} TICKETS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-full text-[9px] md:text-[10px] font-black shadow-lg shadow-slate-100">{colItems.length}</span>
                <div className="md:hidden text-slate-300">
                  {expandedCol === col.id ? <LucideChevronUp size={16}/> : <LucideChevronDown size={16}/>}
                </div>
              </div>
            </div>

            <div className={`flex-1 space-y-4 md:space-y-5 p-1 md:p-2 bg-slate-50/30 rounded-3xl md:rounded-[3rem] min-h-[0] md:min-h-[500px] transition-all duration-300 ${expandedCol === col.id || (window.innerWidth >= 768) ? 'opacity-100 max-h-full py-2' : 'opacity-0 max-h-0 overflow-hidden md:opacity-100 md:max-h-none md:overflow-visible'}`}>
              {colItems.map(item => (
                <KanbanCard 
                  key={item.id} 
                  request={item} 
                  onClick={onSelect} 
                  onDragStart={handleDragStart}
                />
              ))}

              {colItems.length === 0 && (
                <div className="h-24 md:h-40 border-4 border-dashed border-slate-200/50 rounded-2xl md:rounded-[3rem] flex flex-col items-center justify-center opacity-10 transition-all">
                  <LucideZap size={32} className="md:w-[48px] md:h-[48px]"/>
                  <p className="text-[8px] md:text-[9px] font-black uppercase mt-2 md:mt-3 tracking-[0.2em] md:tracking-[0.3em]">Cola Vacía</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};