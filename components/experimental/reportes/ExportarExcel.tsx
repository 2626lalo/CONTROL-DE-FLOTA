import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportReportToExcel = (data: any[], type: string, addNotification: any) => {
  if (!data || data.length === 0) {
    addNotification("No hay datos para exportar con los filtros seleccionados", "error");
    return;
  }

  try {
    addNotification("Generando planilla Excel...", "warning");
    
    // Mapeo dinámico según el tipo de datos
    const mappedData = data.map(item => {
      if (type === 'VEHICULOS') {
        return {
          'DOMINIO': item.plate,
          'MARCA': item.make,
          'MODELO': item.model,
          'KM ACTUAL': item.currentKm,
          'C. COSTO': item.costCenter,
          'ESTADO': item.status,
          'PROVINCIA': item.province
        };
      }
      if (type === 'SERVICIOS') {
        return {
          'CODIGO': item.code,
          'UNIDAD': item.vehiclePlate,
          'TIPO': item.specificType,
          'ESTADO': item.stage,
          'SOLICITANTE': item.userName,
          'C. COSTO': item.costCenter,
          'FECHA': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')
        };
      }
      if (type === 'USUARIOS') {
        return {
          'NOMBRE': item.nombre,
          'APELLIDO': item.apellido,
          'EMAIL': item.email,
          'ROL': item.role,
          'ESTADO': item.estado,
          'C. COSTO': item.costCenter || item.centroCosto?.nombre
        };
      }
      if (type === 'MANTENIMIENTO') {
        return {
          'UNIDAD': item.plate,
          'KM ACTUAL': item.currentKm,
          'PROXIMO SERVICE': item.nextServiceKm,
          'RESTANTE': item.nextServiceKm - item.currentKm,
          'C. COSTO': item.costCenter
        };
      }
      if (type === 'COSTOS') {
        return {
          'UNIDAD': item.plate,
          'OPEX TOTAL': item.totalOpex || 0,
          'CAPEX': item.purchaseValue || 0,
          'VALOR ALQUILER': item.adminData?.valorAlquilerMensual || 0,
          'C. COSTO': item.costCenter
        };
      }
      return item;
    });

    const ws = XLSX.utils.json_to_sheet(mappedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    
    const fileName = `Reporte_${type}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addNotification("Archivo Excel generado con éxito", "success");
  } catch (error) {
    console.error(error);
    addNotification("Fallo al generar Excel", "error");
  }
};