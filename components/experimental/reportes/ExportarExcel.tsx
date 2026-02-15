import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportReportToExcel = (data: any[], type: string, addNotification: any) => {
  if (!data || data.length === 0) {
    addNotification("No hay datos para exportar con los filtros seleccionados", "error");
    return;
  }

  try {
    addNotification("Generando planilla Excel...", "warning");
    
    // Mapeo dinámico según el tipo de datos para limpiar para Excel
    const mappedData = data.map(item => {
      if (type === 'VEHICULOS') {
        return {
          'DOMINIO': item.plate,
          'MARCA': item.make,
          'MODELO': item.model,
          'KM ACTUAL': item.currentKm,
          'C. COSTO': item.costCenter,
          'ESTADO': item.status,
          'PROVINCIA': item.province,
          'PROPIEDAD': item.ownership
        };
      }
      if (type === 'SERVICIOS') {
        return {
          'CODIGO': item.code,
          'UNIDAD': item.vehiclePlate,
          'CATEGORIA': item.mainCategory,
          'TIPO': item.specificType,
          'ESTADO': item.stage,
          'SOLICITANTE': item.userName,
          'C. COSTO': item.costCenter,
          'FECHA': format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm'),
          'PRIORIDAD': item.priority
        };
      }
      if (type === 'USUARIOS') {
        return {
          'NOMBRE': item.nombre,
          'APELLIDO': item.apellido,
          'EMAIL': item.email,
          'ROL': item.role,
          'ESTADO': item.estado,
          'CENTRO DE COSTO': item.costCenter || item.centroCosto?.nombre
        };
      }
      if (type === 'MANTENIMIENTO') {
        return {
          'UNIDAD': item.plate,
          'KM ACTUAL': item.currentKm,
          'PROXIMO SERVICE': item.nextServiceKm,
          'RESTANTE (KM)': item.nextServiceKm - item.currentKm,
          'C. COSTO': item.costCenter,
          'ESTADO TÉCNICO': (item.nextServiceKm - item.currentKm) < 1500 ? 'URGENTE' : 'OK'
        };
      }
      if (type === 'COSTOS') {
        return {
          'UNIDAD': item.plate,
          'CAPEX (COMPRA)': item.purchaseValue || 0,
          'OPEX (MANTENIMIENTO)': item.totalOpex || 0,
          'CANON ALQUILER': item.adminData?.valorAlquilerMensual || 0,
          'CENTRO COSTO': item.costCenter
        };
      }
      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(mappedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type);
    
    // Auto-size columns
    const colWidths = [];
    if (mappedData.length > 0) {
      const headers = Object.keys(mappedData[0]);
      headers.forEach((key, i) => {
        let maxLen = key.length;
        mappedData.forEach(row => {
          const val = String((row as any)[key] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        colWidths[i] = { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = colWidths;
    }
    
    const fileName = `reporte_${type.toLowerCase()}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    addNotification("Archivo Excel generado con éxito", "success");
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    addNotification("Fallo al generar Excel", "error");
  }
};