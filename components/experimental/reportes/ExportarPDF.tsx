import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportReportToPDF = (data: any[], type: string, addNotification: any) => {
  if (!data || data.length === 0) {
    addNotification("No hay datos para exportar", "error");
    return;
  }

  try {
    addNotification("Generando reporte PDF...", "warning");
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Estilo de Cabecera Corporativa
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(`REPORTE ESTRATÉGICO: ${type}`, 15, 25);
    doc.setFontSize(9);
    doc.text(`EMISIÓN: ${format(new Date(), 'dd/MM/yyyy HH:mm')} HS | GENERADO POR FLEETPRO ENTERPRISE`, 15, 33);

    let head: string[][] = [];
    let body: any[][] = [];

    if (type === 'VEHICULOS') {
      head = [['DOMINIO', 'MARCA/MODELO', 'KM ACTUAL', 'CENTRO COSTO', 'ESTADO', 'PROVINCIA']];
      body = data.map(v => [v.plate, `${v.make} ${v.model}`, v.currentKm?.toLocaleString(), v.costCenter, v.status, v.province]);
    } else if (type === 'SERVICIOS') {
      head = [['CÓDIGO', 'UNIDAD', 'TIPO GESTIÓN', 'ESTADO', 'SOLICITANTE', 'FECHA', 'CC']];
      body = data.map(s => [s.code, s.vehiclePlate, s.specificType, s.stage, s.userName, format(new Date(s.createdAt), 'dd/MM/yy'), s.costCenter]);
    } else if (type === 'USUARIOS') {
      head = [['IDENTIDAD', 'EMAIL', 'ROL', 'ESTADO', 'CENTRO COSTO']];
      body = data.map(u => [`${u.nombre} ${u.apellido}`, u.email, u.role, u.estado, u.costCenter || u.centroCosto?.nombre || 'S/N']);
    } else if (type === 'MANTENIMIENTO') {
      head = [['UNIDAD', 'KM ACTUAL', 'PROX. SERVICE', 'RESTANTE (KM)', 'ESTADO CICLO']];
      body = data.map(v => {
        const rest = (v.nextServiceKm || 0) - (v.currentKm || 0);
        return [v.plate, v.currentKm?.toLocaleString(), v.nextServiceKm?.toLocaleString(), `${rest.toLocaleString()} KM`, rest < 1500 ? 'URGENTE' : 'OK'];
      });
    } else if (type === 'COSTOS') {
      head = [['UNIDAD', 'CAPEX (VALOR)', 'OPEX ACUMULADO', 'ALQUILER MES', 'CENTRO COSTO']];
      body = data.map(v => [v.plate, `$${(v.purchaseValue || 0).toLocaleString()}`, `$${(v.totalOpex || 0).toLocaleString()}`, `$${(v.adminData?.valorAlquilerMensual || 0).toLocaleString()}`, v.costCenter]);
    }

    autoTable(doc, {
      startY: 50,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 }
    });

    // Pie de página
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`reporte_${type.toLowerCase()}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    addNotification("Reporte PDF generado correctamente", "success");
  } catch (error) {
    console.error('Error generating PDF:', error);
    addNotification("Error generando PDF", "error");
  }
};