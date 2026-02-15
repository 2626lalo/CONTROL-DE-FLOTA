import React, { useState, useRef, useEffect } from 'react';
import { LucideSend, LucideMessageCircle, LucideUser, LucideSmile, LucidePaperclip } from 'lucide-react';
import { ServiceMessage, UserRole, User } from '../../types';
import { format, parseISO } from 'date-fns';

interface Props {
  messages: ServiceMessage[];
  currentUser: User;
  onSendMessage: (text: string) => void;
  readOnly?: boolean;
}

export const ChatServicio: React.FC<Props> = ({ messages, currentUser, onSendMessage, readOnly }) => {
  const [text, setText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || readOnly) return;
    onSendMessage(text);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner animate-fadeIn">
      <div className="p-6 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <LucideMessageCircle size={20}/>
          </div>
          <div>
            <h5 className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest leading-none">Mesa de Diálogo</h5>
            <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Conexión Segura v3.0</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar scroll-smooth">
        {(!messages || messages.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale py-20">
            <LucideSend size={64} className="mb-6 animate-bounce text-slate-300"/>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sin intercambio de mensajes aún</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.userId === currentUser.id;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`max-w-[85%] space-y-2`}>
                  <div className={`flex items-center gap-2 mb-1 px-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-5 h-5 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[7px] font-black uppercase">
                      {m.userName.charAt(0)}
                    </div>
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{m.userName} • {format(parseISO(m.timestamp), 'HH:mm')} HS</span>
                  </div>
                  <div className={`p-5 rounded-[2rem] shadow-sm border text-[11px] font-medium leading-relaxed italic ${
                    isMe ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none'
                  }`}>
                    "{m.text}"
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef}></div>
      </div>

      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <div className="relative group">
          <textarea 
            rows={2} 
            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-xs outline-none focus:ring-8 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white transition-all shadow-inner resize-none custom-scrollbar" 
            placeholder={readOnly ? "DIÁLOGO CERRADO..." : "Escribir mensaje al operador..."} 
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            disabled={readOnly}
          />
          <div className="absolute right-4 bottom-4 flex gap-2">
            <button disabled={readOnly} onClick={handleSend} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-30">
              <LucideSend size={20}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};