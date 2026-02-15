
import React from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, isToday, startOfWeek, endOfWeek 
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { LucideChevronLeft, LucideChevronRight, LucideCalendarDays, LucideWrench } from 'lucide-react';

interface Props {
  mantenimientos: any[];
}

export const CalendarioMantenimiento: React.FC<Props> = ({ mantenimientos }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
      <div className="bg-slate-950 p-10 text-white flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-xl"><LucideCalendarDays size={32}/></div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Agenda Técnica</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 italic">{format(currentDate, 'MMMM yyyy', { locale: es })}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={prevMonth} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"><LucideChevronLeft/></button>
          <button onClick={nextMonth} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"><LucideChevronRight/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-50">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
          <div key={d} className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 min-h-[600px] border-l border-slate-50">
        {days.map((day, idx) => {
          const events = mantenimientos.filter(m => isSameDay(parseISO(m.fecha), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();

          return (
            <div 
              key={idx} 
              className={`border-r border-b border-slate-50 p-4 space-y-3 min-h-[120px] transition-all hover:bg-slate-50/50 ${
                !isCurrentMonth ? 'opacity-20' : ''
              }`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[12px] font-black ${
                  isToday(day) ? 'w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg' : 'text-slate-400'
                }`}>
                  {format(day, 'd')}
                </span>
                {events.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
              </div>
              <div className="space-y-1.5">
                {events.map((e, i) => (
                  <div key={i} className="px-3 py-1.5 bg-slate-900 rounded-xl text-[8px] font-black text-white uppercase truncate flex items-center gap-2 group cursor-pointer shadow-lg shadow-slate-100">
                    <LucideWrench size={10} className="text-blue-400"/> {e.vehiclePlate}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { parseISO } from 'date-fns';
