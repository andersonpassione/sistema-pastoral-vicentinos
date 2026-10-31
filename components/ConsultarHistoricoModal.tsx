'use client';

import React, { useState } from 'react';
import { 
  X, 
  History, 
  Search, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  Download, 
  FileText,
  User,
  Heart
} from 'lucide-react';
import { DeliveryRecord } from '@/lib/data';

interface ConsultarHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: DeliveryRecord[];
}

export default function ConsultarHistoricoModal({
  isOpen,
  onClose,
  deliveries
}: ConsultarHistoricoModalProps) {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  if (!isOpen) return null;

  const filtered = deliveries.filter((d) => {
    if (search && !d.familyName.toLowerCase().includes(search.toLowerCase()) && !d.protocolNumber.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#263142]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#f0f3ff] flex items-center justify-between border-b border-[#dee8ff]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#d6e3ff] text-[#455f88] flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[16px] sm:text-[18px] font-bold text-[#111c2c] truncate">Histórico Geral de Entregas</h3>
              <p className="text-[11px] sm:text-[12px] text-[#3f4942] truncate">Registro de retiradas e visitas pastorais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#dee8ff] text-[#3f4942] min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 sm:p-4 bg-white border-b border-[#dee8ff] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#3f4942] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nome ou número do protocolo..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[13px] text-[#111c2c] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
            />
          </div>
          <button
            onClick={() => alert('Planilha exportada com sucesso em formato CSV/Excel.')}
            className="px-4 h-10 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#455f88] font-bold text-[12px] flex items-center justify-center gap-2 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Download className="w-4 h-4" /> Exportar Livro de Registro
          </button>
        </div>

        {/* Deliveries List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#6f7a72] text-[14px]">
              Nenhum registro encontrado.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#e7eeff]/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#9cf5c5] text-[#00603e] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#111c2c] text-[14px]">{item.familyName}</span>
                      <span className="px-2 py-0.5 rounded bg-[#dee8ff] text-[#455f88] font-mono text-[10px] font-bold">
                        {item.protocolNumber}
                      </span>
                    </div>
                    <div className="text-[12px] text-[#3f4942] flex items-center gap-2 mt-0.5">
                      <span>Atendido por: {item.volunteerName}</span>
                    </div>
                    {item.observation && (
                      <p className="text-[11px] text-[#00603e] italic mt-1 bg-white/70 p-1.5 rounded-lg border border-[#d8e3fa]">
                        “{item.observation}”
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                  <span className="text-[12px] font-bold text-[#111c2c]">{item.timeFormatted}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234] text-[11px] font-bold">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f0f3ff] border-t border-[#dee8ff] flex justify-between items-center text-[12px] text-[#3f4942]">
          <span>Total de registros listados: {filtered.length}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00603e] text-white font-bold text-[13px] hover:bg-[#1b7a53]"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
