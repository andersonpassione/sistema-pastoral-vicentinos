'use client';

import React, { useState } from 'react';
import { 
  Download, 
  PackageCheck, 
  Users, 
  Heart, 
  HeartHandshake,
  Calendar,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  Search,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Package,
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Family,
  DeliveryRecord,
  PastoralSettings,
  checkMonthlyDeliveryLimit,
  parseFlexibleDate,
  isSameCalendarMonth
} from '@/lib/data';

interface RelatoriosViewProps {
  families: Family[];
  todayDeliveries: DeliveryRecord[];
  settings: PastoralSettings;
}

export default function RelatoriosView({
  families,
  todayDeliveries,
  settings
}: RelatoriosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'com-visita' | 'sem-visita'>('todos');

  // 1. Total de Cestas Entregues no Mês Atual
  const now = new Date();
  const entregasMesAtual = todayDeliveries.filter(
    (d) => d.status !== 'Cancelado' && isSameCalendarMonth(parseFlexibleDate(d.timestamp), now)
  );
  const totalCestasEntregues = entregasMesAtual.length;

  // 2. Famílias com status "Em acompanhamento" e Projeção de Cestas para o Mês
  const familiasEmAcompanhamento = families.filter((f) => f.status === 'em_acompanhamento');
  const projecaoCestasMes = familiasEmAcompanhamento.length;

  // Famílias em acompanhamento já atendidas neste mês
  const familiasAtendidasNoMes = familiasEmAcompanhamento.filter(
    (f) => checkMonthlyDeliveryLimit(f, todayDeliveries).isBlocked
  ).length;

  // Cestas ainda necessárias para fechar o mês
  const cestasPendentesMes = Math.max(0, projecaoCestasMes - familiasAtendidasNoMes);
  const percentualAtendido = projecaoCestasMes > 0 ? Math.round((familiasAtendidasNoMes / projecaoCestasMes) * 100) : 100;

  // 3. Total de Famílias Cadastradas
  const totalFamiliasCadastradas = families.length;

  // 4. Total de Crianças Assistidas (considerando até 12 anos como criança conforme solicitação)
  const totalCriancasAssistidas = families.reduce((acc, f) => {
    if (!f.dependents || !Array.isArray(f.dependents)) return acc;
    const childrenCount = f.dependents.filter((d) => typeof d.age === 'number' && d.age <= 12).length;
    return acc + childrenCount;
  }, 0);

  // 5. Total de Pessoas Assistidas (titulares + dependentes)
  const totalPessoasAssistidas = families.reduce((acc, f) => {
    const deps = f.dependents?.length || 0;
    return acc + 1 + deps;
  }, 0);

  // Filtered deliveries for transparency table
  const filteredDeliveries = todayDeliveries.filter((d) => {
    if (selectedFilter === 'com-visita' && !d.pastoralVisitRequested) return false;
    if (selectedFilter === 'sem-visita' && d.pastoralVisitRequested) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = d.familyName.toLowerCase().includes(q);
      const matchProtocol = d.protocolNumber.toLowerCase().includes(q);
      const matchVolunteer = d.volunteerName.toLowerCase().includes(q);
      if (!matchName && !matchProtocol && !matchVolunteer) return false;
    }
    return true;
  });

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const issueDate = new Date();
    const monthLabel = issueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    // Top Institutional Header Band
    doc.setFillColor(0, 96, 62); // #00603e
    doc.rect(0, 0, pageWidth, 34, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BALANCETE OFICIAL E PRESTAÇÃO DE CONTAS', 14, 14);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.parishName.toUpperCase()} • PASTORAL DOS VICENTINOS`, 14, 21);
    doc.setFontSize(8.5);
    doc.text(
      `Competência: ${capitalizedMonth}   |   Emitido em: ${issueDate.toLocaleDateString('pt-BR')} às ${issueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      14,
      28
    );

    // Section 1: Consolidated Indicators Table
    doc.setTextColor(17, 28, 44);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. RESUMO EXECUTIVO E INDICADORES MENSAIS', 14, 44);

    const emAcompCount = familiasEmAcompanhamento.length;
    const promovidasCount = families.filter((f) => f.status === 'promovida').length;
    const inativasCount = families.filter((f) => f.status === 'inativa').length;

    autoTable(doc, {
      startY: 48,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 243, 255],
        textColor: [17, 28, 44],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8.8,
        textColor: [40, 50, 60],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 95 },
        1: { cellWidth: 'auto' },
      },
      head: [['Indicador Pastoral', 'Resultado Apurado']],
      body: [
        ['Demanda Mensal Projetada (Em Acompanhamento)', `${projecaoCestasMes} cestas básicas`],
        ['Cestas Entregues no Mês Vigente', `${totalCestasEntregues} cestas (${percentualAtendido}% da meta mensal)`],
        ['Cestas Pendentes para Cobertura do Mês', `${cestasPendentesMes} cestas`],
        [
          'Base de Famílias Cadastradas',
          `${totalFamiliasCadastradas} total (${emAcompCount} Em acompanhamento, ${promovidasCount} Promovidas, ${inativasCount} Inativas)`,
        ],
        ['Crianças Assistidas (até 12 anos)', `${totalCriancasAssistidas} crianças`],
        ['Total de Pessoas Assistidas (Titulares + Dependentes)', `${totalPessoasAssistidas} pessoas`],
        [
          'Regras Paroquiais Vigentes',
          `Máximo de 1 cesta por mês civil • Intervalo mínimo de ${settings.minIntervalDays} dias`,
        ],
      ],
    });

    const afterSummaryY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 120;

    // Section 2: Deliveries Accountability Table
    doc.setTextColor(17, 28, 44);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`2. RELAÇÃO NOMINAL DE ENTREGAS (${filteredDeliveries.length} REGISTROS)`, 14, afterSummaryY);

    const deliveryRows =
      filteredDeliveries.length > 0
        ? filteredDeliveries.map((d) => [
            d.protocolNumber,
            d.familyName,
            d.dateFormatted ? `${d.dateFormatted} ${d.timeFormatted}` : d.timeFormatted,
            d.basketType || 'Cesta Básica',
            d.volunteerName,
            d.pastoralVisitRequested ? 'Solicitada' : 'Não',
            d.status,
          ])
        : [['—', 'Nenhuma entrega registrada para os filtros atuais.', '—', '—', '—', '—', '—']];

    autoTable(doc, {
      startY: afterSummaryY + 4,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 96, 62],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8.2,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 255],
      },
      head: [['Protocolo', 'Família Beneficiária', 'Data / Hora', 'Benefício', 'Voluntário', 'Visita', 'Situação']],
      body: deliveryRows,
    });

    // Section 3: Signatures Block
    const pageHeight = doc.internal.pageSize.getHeight();
    let signY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 24 : pageHeight - 42;
    if (signY > pageHeight - 36) {
      doc.addPage();
      signY = 40;
    }

    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.line(22, signY, 92, signY);
    doc.line(pageWidth - 92, signY, pageWidth - 22, signY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(17, 28, 44);
    doc.text('Coordenação Pastoral dos Vicentinos', 57, signY + 5, { align: 'center' });
    doc.text(`Pároco / Conselho Paroquial`, pageWidth - 57, signY + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Responsável pela Conferência', 57, signY + 9.5, { align: 'center' });
    doc.text(settings.parishName, pageWidth - 57, signY + 9.5, { align: 'center' });

    // Footer with page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(120, 130, 140);
      doc.text(
        `Documento Oficial de Prestação de Contas • ${settings.parishName} • Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
    }

    const safeParish = settings.parishName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    doc.save(`Balancete_Oficial_${safeParish}_${issueDate.toISOString().slice(0, 7)}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ['Protocolo', 'Família', 'Data', 'Horário', 'Voluntário', 'Paróquia', 'Visita Pastoral', 'Status'];
    const rows = todayDeliveries.map((d) => [
      d.protocolNumber,
      `"${d.familyName}"`,
      d.dateFormatted || '-',
      d.timeFormatted,
      `"${d.volunteerName}"`,
      `"${d.parishUnit}"`,
      d.pastoralVisitRequested ? 'Sim' : 'Não',
      d.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prestacao_contas_entregas_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-5 sm:py-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#9cf5c5] text-[#00603e]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold text-[#00603e] uppercase tracking-wider">
              {settings.parishName} • Prestação de Contas
            </span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-[#111c2c] tracking-tight leading-tight mt-1">
            Relatórios e Prestação Pastoral
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#3f4942]">
            Transparência das cestas distribuídas e famílias assistidas com regra de 1 cesta por mês.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl bg-[#f0f3ff] text-[#455f88] hover:bg-[#e7eeff] border border-[#d8e3fa] font-bold text-[13px] shadow-sm transition-colors min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-[#00603e] hover:bg-[#1b7a53] text-white font-bold text-[13px] sm:text-[14px] shadow-sm transition-all min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            <span>Baixar Balancete Oficial (PDF)</span>
          </button>
        </div>
      </div>

      {/* 5 Main KPI Cards: Inclui Projeção de Cestas para o Mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Total de Cestas Entregues */}
        <div className="p-4 rounded-2xl bg-white border border-[#dee8ff] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Total de Cestas Entregues
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#9cf5c5]/40 text-[#00603e] flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-black text-[#00603e] leading-none">
              {totalCestasEntregues}
            </div>
            <span className="text-[11px] text-[#1b7a53] font-medium mt-1.5 block">
              Cestas no mês corrente
            </span>
          </div>
        </div>

        {/* 2. Projeção de Cestas Necessárias no Mês (Solicitado expressamente pelo usuário) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#9cf5c5]/25 via-white to-white border border-[#80d8aa]/70 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#005234]">
              Projeção Cestas (Mês)
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#00603e] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-black text-[#00603e] leading-none">
              {projecaoCestasMes}
            </div>
            <span className="text-[11px] text-[#00603e] font-bold mt-1.5 block">
              Famílias em acompanhamento
            </span>
          </div>
        </div>

        {/* 3. Total de Famílias Cadastradas */}
        <div className="p-4 rounded-2xl bg-white border border-[#dee8ff] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Famílias Cadastradas
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#d8e3fa]/60 text-[#455f88] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-black text-[#455f88] leading-none">
              {totalFamiliasCadastradas}
            </div>
            <span className="text-[11px] text-[#455f88] font-medium mt-1.5 block">
              Prontuários no núcleo
            </span>
          </div>
        </div>

        {/* 4. Total de Crianças Assistidas (Até 12 anos conforme solicitado) */}
        <div className="p-4 rounded-2xl bg-white border border-[#dee8ff] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Crianças Assistidas
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#ffdcc3]/60 text-[#814400] flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-black text-[#814400] leading-none">
              {totalCriancasAssistidas}
            </div>
            <span className="text-[11px] text-[#814400] font-medium mt-1.5 block">
              Até 12 anos de idade
            </span>
          </div>
        </div>

        {/* 5. Total de Pessoas Assistidas */}
        <div className="p-4 rounded-2xl bg-white border border-[#dee8ff] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Pessoas Assistidas
            </span>
            <span className="w-8 h-8 rounded-xl bg-[#9cf5c5]/40 text-[#00603e] flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-[26px] sm:text-[30px] font-black text-[#00603e] leading-none">
              {totalPessoasAssistidas}
            </div>
            <span className="text-[11px] text-[#1b7a53] font-medium mt-1.5 block">
              Titulares e dependentes
            </span>
          </div>
        </div>
      </div>

      {/* Painel Dedicado: Projeção & Planejamento Mensal de Suprimentos */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#f0fbf5] via-white to-[#f0f5ff] border border-[#80d8aa]/60 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00603e] text-white flex items-center justify-center shadow-sm shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] sm:text-[18px] font-bold text-[#111c2c]">
                  Projeção e Planejamento de Cestas para o Mês
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#9cf5c5] text-[#005234] text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00603e]" />
                  Base: Status Em Acompanhamento
                </span>
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#3f4942] mt-0.5">
                Projeção calculada exclusivamente sobre as <strong>{familiasEmAcompanhamento.length} famílias com status &ldquo;Em acompanhamento&rdquo;</strong> (1 cesta mensal por família).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-[#d8e3fa] shadow-2xs">
            <Calendar className="w-4 h-4 text-[#00603e]" />
            <span className="text-[12px] font-bold text-[#111c2c]">Mês Vigente • Meta Mensal</span>
          </div>
        </div>

        {/* 3 Metric Cards for Projection Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Card A: Demanda Total Projetada */}
          <div className="p-4 rounded-xl bg-white border border-[#d8e3fa] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Demanda Mensal Projetada
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] sm:text-[32px] font-black text-[#00603e] leading-none">
                {projecaoCestasMes}
              </span>
              <span className="text-[12px] text-[#3f4942] font-semibold">cestas básicas</span>
            </div>
            <span className="text-[11px] text-[#1b7a53] mt-1 block">
              {familiasEmAcompanhamento.length} famílias em acompanhamento ativo
            </span>
          </div>

          {/* Card B: Cestas Já Atendidas */}
          <div className="p-4 rounded-xl bg-white border border-[#d8e3fa] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Cestas Já Entregues no Mês
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] sm:text-[32px] font-black text-[#455f88] leading-none">
                {familiasAtendidasNoMes}
              </span>
              <span className="text-[12px] text-[#3f4942] font-semibold">de {projecaoCestasMes} cestas</span>
            </div>
            <span className="text-[11px] text-[#455f88] mt-1 block">
              {percentualAtendido}% da demanda do mês coberta
            </span>
          </div>

          {/* Card C: Cestas Pendentes */}
          <div className="p-4 rounded-xl bg-white border border-[#d8e3fa] shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#3f4942]">
              Cestas Ainda Pendentes
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[28px] sm:text-[32px] font-black text-[#814400] leading-none">
                {cestasPendentesMes}
              </span>
              <span className="text-[12px] text-[#3f4942] font-semibold">cestas a entregar</span>
            </div>
            <span className="text-[11px] text-[#814400] mt-1 block">
              Necessárias para suprir o mês
            </span>
          </div>
        </div>

        {/* Progress Bar & Planning Insight */}
        <div className="flex flex-col gap-2 bg-white p-3.5 sm:p-4 rounded-xl border border-[#dee8ff]">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-[#111c2c] flex items-center gap-1.5 flex-wrap">
              <span>Cobertura da Demanda Mensal Projetada</span>
              <span className="text-[11px] font-normal text-[#3f4942]">
                ({familiasAtendidasNoMes} de {projecaoCestasMes} famílias atendidas)
              </span>
            </span>
            <span className="font-extrabold text-[#00603e] text-[13px]">{percentualAtendido}%</span>
          </div>
          <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#1b7a53] to-[#00603e] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, percentualAtendido))}%` }}
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#3f4942] pt-0.5 gap-1">
            <span>Famílias em acompanhamento já atendidas: <strong>{familiasAtendidasNoMes}</strong></span>
            <span>Meta de arrecadação/estoque para fechar o mês: <strong>{cestasPendentesMes} cestas básicas</strong></span>
          </div>
        </div>
      </div>

      {/* Pastoral Rules & Integrity Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#dee8ff] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#00603e] shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[13px] sm:text-[14px] text-[#111c2c] font-bold">
              Diretrizes de Auditoria e Partilha Justa
            </span>
            <p className="text-[12px] text-[#3f4942] mt-0.5 max-w-3xl">
              Limite estrito de <strong>1 cesta básica por mês civil por família</strong> ativo. Intervalo mínimo configurado em <strong>{settings.minIntervalDays} dias</strong> pela coordenação paroquial. Crianças contabilizadas até 12 anos completos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <span className="px-3 py-1 rounded-full bg-[#9cf5c5] text-[#002112] text-[11px] font-bold uppercase tracking-wider">
            Regra 1 Cesta/Mês: Ativa
          </span>
        </div>
      </div>

      {/* Deliveries Accountability Table (Prestação de Contas Detalhada) */}
      <div className="bg-white rounded-2xl border border-[#dee8ff] shadow-sm overflow-hidden">
        {/* Table Filter & Search Header */}
        <div className="p-4 sm:p-6 border-b border-[#dee8ff] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-[16px] sm:text-[18px] font-bold text-[#111c2c]">
              Registro de Entregas Realizadas
            </h3>
            <p className="text-[12px] sm:text-[13px] text-[#3f4942]">
              Histórico para prestação de contas perante o conselho paroquial e doadores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-[#6f7a72] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por família, protocolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 h-10 rounded-xl bg-[#f0f3ff] border border-[#d8e3fa] text-[12px] sm:text-[13px] text-[#111c2c] placeholder:text-[#6f7a72] focus:outline-none focus:ring-2 focus:ring-[#1b7a53]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#f0f3ff] p-1 rounded-xl border border-[#d8e3fa]">
              <button
                type="button"
                onClick={() => setSelectedFilter('todos')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                  selectedFilter === 'todos'
                    ? 'bg-white text-[#00603e] shadow-xs'
                    : 'text-[#6f7a72] hover:text-[#111c2c]'
                }`}
              >
                Todas ({todayDeliveries.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedFilter('com-visita')}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                  selectedFilter === 'com-visita'
                    ? 'bg-white text-[#00603e] shadow-xs'
                    : 'text-[#6f7a72] hover:text-[#111c2c]'
                }`}
              >
                Com Visita
              </button>
            </div>
          </div>
        </div>

        {/* Deliveries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#dee8ff] bg-[#f8faff] text-[11px] font-bold uppercase tracking-wider text-[#6f7a72]">
                <th className="py-3 px-4 sm:px-6">Protocolo</th>
                <th className="py-3 px-4 sm:px-6">Família Beneficiária</th>
                <th className="py-3 px-4 sm:px-6">Data / Horário</th>
                <th className="py-3 px-4 sm:px-6">Voluntário</th>
                <th className="py-3 px-4 sm:px-6">Visita Pastoral</th>
                <th className="py-3 px-4 sm:px-6">Status / Cota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee8ff] text-[12px] sm:text-[13px] text-[#111c2c]">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6f7a72]">
                    Nenhuma entrega localizada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-[#f8faff] transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-[#455f88] whitespace-nowrap">
                      {d.protocolNumber}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold whitespace-nowrap">
                      {d.familyName}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-[#3f4942] whitespace-nowrap">
                      {d.dateFormatted ? `${d.dateFormatted} • ${d.timeFormatted}` : d.timeFormatted}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-[#3f4942] whitespace-nowrap">
                      {d.volunteerName}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      {d.pastoralVisitRequested ? (
                        <span className="inline-flex items-center gap-1 text-[#00603e] font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Solicitada
                        </span>
                      ) : (
                        <span className="text-[#6f7a72] text-[11px]">Não agendada</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#9cf5c5] text-[#002112] text-[10px] sm:text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00603e]" />
                        Cota Mensal Concluída (1/1)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 sm:p-5 bg-[#f8faff] border-t border-[#dee8ff] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-[#3f4942]">
          <span>
            Mostrando <strong>{filteredDeliveries.length}</strong> de <strong>{todayDeliveries.length}</strong> entregas registradas
          </span>
          <span className="font-medium text-[#00603e]">
            {settings.parishName} • Conferências Vicentinas
          </span>
        </div>
      </div>
    </div>
  );
}
