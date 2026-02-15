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

    // Estilo de Cabecera
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
      head = [['DOMINIO', 'MARCA/MODELO', 'KM', 'C. COSTO', 'ESTADO']];
      body = data.map(v => [v.plate, `${v.make} ${v.model}`, v.currentKm.toLocaleString(), v.costCenter, v.status]);
    } else if (type === 'SERVICIOS') {
      head = [['COD', 'UNIDAD', 'GESTIÓN', 'ESTADO', 'SOLICITANTE', 'FECHA']];
      body = data.map(s => [s.code, s.vehiclePlate, s.specificType, s.stage, s.userName, format(new Date(s.createdAt), 'dd/MM/yy')]);
    } else if (type === 'USUARIOS') {
      head = [['IDENTIDAD', 'EMAIL', 'ROL', 'ESTADO', 'CENTRO COSTO']];
      body = data.map(u => [`${u.nombre} ${u.apellido}`, u.email, u.role, u.estado, u.costCenter || 'S/N']);
    } else if (type === 'MANTENIMIENTO') {
      head = [['UNIDAD', 'KM ACTUAL', 'PROX. SERVICE', 'RESTANTE', 'CRITICIDAD']];
      body = data.map(v => {
        const rest = v.nextServiceKm - v.currentKm;
        return [v.plate, v.currentKm.toLocaleString(), v.nextServiceKm.toLocaleString(), `${rest.toLocaleString()} KM`, rest < 1500 ? 'ALTA' : 'NORMAL'];
      });
    }

    autoTable(doc, {
      startY: 50,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Reporte_${type}_${Date.now()}.pdf`);
    addNotification("Reporte PDF descargado", "success");
  } catch (error) {
    console.error(error);
    addNotification("Error generando PDF", "error");
  }
};