import React, { useState } from 'react';
import { useApp } from '../App';
import { Link, useNavigate } from 'react-router-dom';
import { LucidePlus, LucideSearch, LucideFileText, LucideEdit, LucideAlertTriangle, LucideAlertOctagon, LucideFileWarning, LucideLayers, LucideLayoutGrid, LucideClock, LucideDownload, LucideFileSpreadsheet, LucideCheckCircle, LucideFilter, LucideBuilding2, LucideBriefcase, LucideX, LucideShield, LucideShieldAlert, LucideShieldCheck, LucideEye, LucideActivity, LucideHistory, LucideArchive, LucideArrowLeft, LucideTrash2, LucideCloudOff, LucideChevronDown, LucideLock, LucideAlertCircle, LucidePencil, LucideSmartphone, LucideMail } from 'lucide-react';
import { Vehicle, OwnershipType, UserRole, VehicleStatus, ServiceStage } from '../types';
import { jsPDF } from "jspdf";
import { ConfirmationModal } from './ConfirmationModal';

export const VehicleList = () => {
  const { vehicles, user, deleteVehicle, updateVehicle, serviceRequests, checklists } = useApp();
  const [search, setSearch] = useState('');
  
  // VIEW MODE STATE: 'ACTIVE' (Default) or 'HISTORY' (Inactive/Returned)
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // Filter States
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });
  
  // MULTI-SELECT COST CENTER STATE
  const [filterCostCenters, setFilterCostCenters] = useState<string[]>([]);
  const [isCCOpen, setIsCCOpen] = useState(false);

  const [filterOwnership, setFilterOwnership] = useState('ALL'); 
  const [customOwnership, setCustomOwnership] = useState(''); // For typing a new filter
  const [filterProvider, setFilterProvider] = useState('');

  const [groupByCostCenter, setGroupByCostCenter] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const navigate = useNavigate();

  // ROLE CHECK & COST CENTER SEGMENTATION
  // Admin L2 is considered a manager for "canManageFleet" purposes (edit, create) but NOT delete
  const canManageFleet = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN_L2;
  const isMainAdmin = user?.role === UserRole.ADMIN;
  
  // Identify user's mandatory cost center (if any)
  const userCostCenter = (!isMainAdmin && user?.role !== UserRole.ADMIN_L2 && user?.costCenter) ? user.costCenter : null;

  // Filter vehicles available to this user FIRST
  const availableVehicles = vehicles.filter(v => {
      if (userCostCenter) {
          // Strict filtering by CC for non-admins (Manager/Driver)
          // Admin L2 sees everything like Admin
          return v.costCenter === userCostCenter;
      }
      return true;
  });

  // Get unique Cost Centers (from available vehicles)
  const uniqueCostCenters = Array.from(new Set(availableVehicles.map(v => v.costCenter).filter(Boolean))).sort();
  
  // Get unique Rental Providers
  const uniqueProviders = Array.from(new Set(availableVehicles.map(v => v.rentalProvider).filter(Boolean))).sort();

  // Get unique Ownerships that are NOT the standard ones
  const standardOwnerships = [OwnershipType.OWNED, OwnershipType.RENTED, OwnershipType.LEASING];
  const uniqueDynamicOwnerships = Array.from(new Set(availableVehicles.map(v => v.ownership)))
      .filter(o => !standardOwnerships.includes(o as any))
      .sort();

  const filtered = availableVehicles.filter(v => {
    // 0. View Mode Filter (Crucial Split)
    if (viewMode === 'ACTIVE') {
        if (v.status === VehicleStatus.INACTIVE) return false;
    } else {
        if (v.status !== VehicleStatus.INACTIVE) return false;
    }

    // 1. Search Text
    const matchesSearch = v.plate.toLowerCase().includes(search.toLowerCase()) || 
                          v.model.toLowerCase().includes(search.toLowerCase());
    
    // 2. Status (Only applies if not conflicting with View Mode)
    const matchesStatus = filterStatus === '' || v.status === filterStatus;

    // 3. Cost Center (Multi-select Logic - OR Logic)
    // If User has a mandatory CC, this filter is effectively ignored in UI, but logically handled by availableVehicles
    const matchesCostCenter = userCostCenter 
        ? true // Already filtered
        : filterCostCenters.length === 0 || (v.costCenter && filterCostCenters.includes(v.costCenter));

    // 4. Ownership Filter
    let matchesOwnership = true;
    if (filterOwnership !== 'ALL') {
        if (filterOwnership === '__CUSTOM__') {
            if (customOwnership.trim() !== '') {
                 matchesOwnership = v.ownership.toLowerCase().includes(customOwnership.toLowerCase());
            }
        } else {
             matchesOwnership = v.ownership === filterOwnership;
        }
    }

    // 5. Provider
    const matchesProvider = filterProvider === '' || v.rentalProvider === filterProvider;
    
    return matchesSearch && matchesStatus && matchesCostCenter && matchesOwnership && matchesProvider;
  });

  // Grouping Logic (based on the filtered results)
  const costCentersToRender = Array.from(new Set(filtered.map(v => v.costCenter || 'Sin Centro de Costo')));

  // --- HANDLERS FOR COST CENTER ---
  const toggleCostCenter = (cc: string) => {
      setFilterCostCenters(prev => 
          prev.includes(cc) ? prev.filter(c => c !== cc) : [...prev, cc]
      );
  };

  const toggleAllCostCenters = () => {
      if (filterCostCenters.length === uniqueCostCenters.length) {
          setFilterCostCenters([]); // Clear all
      } else {
          setFilterCostCenters(uniqueCostCenters as string[]); // Select all
      }
  };

  // --- TRANSLATION HELPERS ---
  const getVehicleStatusLabel = (status: string) => {
      switch(status) {
          case 'ACTIVE': return 'ACTIVO';
          case 'MAINTENANCE': return 'EN TALLER';
          case 'INACTIVE': return 'INACTIVO';
          default: return status;
      }
  };

  const getOwnershipLabel = (val: string) => {
        if (val === OwnershipType.OWNED) return 'PROPIO';
        if (val === OwnershipType.RENTED) return 'ALQUILADO';
        if (val === OwnershipType.LEASING) return 'LEASING';
        return val;
  };

  const handleDelete = (e: React.MouseEvent, vehicle: Vehicle) => {
      e.preventDefault();
      e.stopPropagation();

      // 1. Check for Active Services (Blocker)
      // Check if there are any requests for this plate that are NOT Delivery or Cancelled
      const hasActiveServices = serviceRequests.some(req => 
          req.vehiclePlate === vehicle.plate && 
          req.stage !== ServiceStage.DELIVERY && 
          req.stage !== ServiceStage.CANCELLED
      );

      if (hasActiveServices) {
          alert(`⛔ IMPOSIBLE ELIMINAR / DAR DE BAJA\n\nLa unidad ${vehicle.plate} tiene Servicios o Reparaciones en proceso.\n\nPor favor, finalice todos los servicios pendientes en el módulo "Servicios" antes de eliminar la unidad.`);
          return;
      }

      // 2. Logic depending on View Mode / Current Status
      if (viewMode === 'ACTIVE' || vehicle.status !== VehicleStatus.INACTIVE) {
          // --- SOFT DELETE (ARCHIVE) ---
          setModalConfig({
              isOpen: true,
              title: "Dar de Baja / Archivar",
              message: `¿Está seguro de dar de BAJA la unidad ${vehicle.plate}?\n\nLa unidad pasará a estado INACTIVO y dejará de aparecer en los listados operativos. El historial se conservará.`,
              onConfirm: () => {
                  const updatedVehicle: Vehicle = {
                      ...vehicle,
                      status: VehicleStatus.INACTIVE,
                      // If rented, maybe set end date automatically to today if not present
                      rentalEndDate: vehicle.ownership === OwnershipType.RENTED && !vehicle.rentalEndDate ? new Date().toISOString().split('T')[0] : vehicle.rentalEndDate
                  };
                  updateVehicle(updatedVehicle);
              }
          });
      } else {
          // --- HARD DELETE (PERMANENT) --- Only Admin from History View
          if (!isMainAdmin) {
              alert("⛔ ACCESO DENEGADO\n\nSolo el Administrador Principal puede eliminar definitivamente registros del historial.");
              return;
          }

          setModalConfig({
              isOpen: true,
              title: "⚠ Eliminación Definitiva",
              message: `¿Está seguro? El registro del unidad ${vehicle.plate} dejará de existir permanentemente y no se podrá recuperar.`,
              onConfirm: () => deleteVehicle(vehicle.plate)
          });
      }
  };

  // ... (Export Logic kept same as previous) ...
  const exportCSV = () => {
      const escape = (val: string | number | undefined) => {
          if (val === undefined || val === null) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
      };

      const reportTitle = viewMode === 'ACTIVE' ? "Reporte de Flota Activa" : "Reporte de Historial / Inactivos";
      const dateStr = new Date().toLocaleDateString();
      
      const metaRows = [
          [reportTitle],
          [`Fecha Generación: ${dateStr}`],
          [`Total Unidades: ${filtered.length}`]
      ];

      const appliedFilters = [];
      if (filterStatus) appliedFilters.push(`Estado: ${getVehicleStatusLabel(filterStatus)}`);
      if (filterCostCenters.length > 0) appliedFilters.push(`Centros de Costo: ${filterCostCenters.join(' | ')}`);
      if (filterOwnership !== 'ALL') appliedFilters.push(`Propiedad: ${filterOwnership === '__CUSTOM__' ? customOwnership : getOwnershipLabel(filterOwnership)}`);
      if (filterProvider) appliedFilters.push(`Proveedor: ${filterProvider}`);
      if (search) appliedFilters.push(`Búsqueda: "${search}"`);
      
      if (appliedFilters.length > 0) {
          metaRows.push([`Filtros Aplicados: ${appliedFilters.join('; ')}`]);
      } else {
          metaRows.push(["Filtros Aplicados: Ninguno (Mostrando todo)"]);
      }
      
      if (groupByCostCenter) {
          metaRows.push(["Agrupación: Visualmente agrupado por Centro de Costo"]);
      }

      const headers = ["Patente", "Marca", "Modelo", "Año", "Tipo", "Estado", "Propiedad", "Proveedor", "Centro Costo", "Provincia", "Usuario Asignado", "Km Actual", "Próximo Service"];
      
      let dataToExport = [...filtered];
      if (groupByCostCenter) {
          dataToExport.sort((a, b) => (a.costCenter || '').localeCompare(b.costCenter || ''));
      }

      const dataRows = dataToExport.map(v => [
          escape(v.plate),
          escape(v.make),
          escape(v.model),
          escape(v.year),
          escape(v.type),
          escape(getVehicleStatusLabel(v.status)),
          escape(getOwnershipLabel(v.ownership)),
          escape(v.rentalProvider || '-'),
          escape(v.costCenter || 'N/D'),
          escape(v.province || 'N/D'),
          escape(v.assignedUser || 'N/D'),
          escape(v.currentKm),
          escape(v.nextServiceKm)
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + metaRows.map(r => r.map(c => escape(c)).join(",")).join("\n") + "\n\n"
          + headers.map(h => escape(h)).join(",") + "\n" 
          + dataRows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `flota_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowExportMenu(false);
  };

  const exportPDF = () => {
      const pdf = new jsPDF();
      let y = 15;

      pdf.setFontSize(18);
      pdf.setTextColor(0, 51, 153);
      pdf.text(viewMode === 'ACTIVE' ? "Reporte de Flota Activa" : "Reporte de Historial / Inactivos", 10, y);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, y);
      pdf.text(`Total Unidades: ${filtered.length}`, 150, y + 5);
      if (userCostCenter) {
          pdf.text(`Centro de Costo: ${userCostCenter}`, 10, y + 5);
      }
      
      let filterText = "";
      if (filterStatus) filterText += `Estado: ${getVehicleStatusLabel(filterStatus)} `;
      if (!userCostCenter && filterCostCenters.length > 0) filterText += `CC: [${filterCostCenters.join(', ')}] `;
      if (filterOwnership !== 'ALL') filterText += `(Propiedad: ${filterOwnership === '__CUSTOM__' ? customOwnership : getOwnershipLabel(filterOwnership)}) `;
      if (filterProvider) filterText += `Prov: ${filterProvider}`;
      
      if(filterText) pdf.text(filterText, 10, y + 7);
      
      y += 15;

      const printRow = (v: Vehicle) => {
          if (y > 270) { pdf.addPage(); y = 20; }
          
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          
          pdf.setFont("helvetica", "bold");
          pdf.text(v.plate, 10, y);
          
          pdf.setFont("helvetica", "normal");
          pdf.text(`${v.make} ${v.model} (${v.year})`, 40, y);
          
          if (v.status === 'MAINTENANCE') pdf.setTextColor(200, 100, 0);
          else if (v.status === 'INACTIVE') pdf.setTextColor(200, 0, 0);
          else pdf.setTextColor(0, 150, 0);
          
          pdf.text(getVehicleStatusLabel(v.status), 100, y);
          pdf.setTextColor(0, 0, 0);
          
          pdf.text(`${v.currentKm} km`, 130, y);
          
          const kmLeft = v.nextServiceKm - v.currentKm;
          if (kmLeft < 0 && v.status !== 'INACTIVE') {
              pdf.setTextColor(200, 0, 0);
              pdf.setFont("helvetica", "bold");
              pdf.text("VENCIDO (" + Math.abs(kmLeft) + "km)", 160, y);
          } else {
               pdf.text(`Prox: ${v.nextServiceKm}`, 160, y);
          }

          y += 5;
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          let extraInfo = `CC: ${v.costCenter || '-'} | Prov: ${v.province || '-'} | Chofer: ${v.assignedUser || '-'}`;
          if (v.ownership !== OwnershipType.OWNED) {
              extraInfo += ` | ${getOwnershipLabel(v.ownership)} (${v.rentalProvider || ''})`;
          }
          if (v.status === 'INACTIVE' && v.rentalEndDate) {
              extraInfo += ` | DEVUELTO: ${v.rentalEndDate}`;
          }

          pdf.text(extraInfo, 10, y);
          
          y += 8;
          pdf.setDrawColor(240, 240, 240);
          pdf.line(10, y-3, 200, y-3);
      };

      if (groupByCostCenter) {
          costCentersToRender.forEach(cc => {
              const vehiclesInCC = filtered.filter(v => (v.costCenter || 'Sin Centro de Costo') === cc);
              if (vehiclesInCC.length === 0) return;

              if (y > 260) { pdf.addPage(); y = 20; }
              
              pdf.setFillColor(240, 240, 240);
              pdf.rect(10, y-5, 190, 8, 'F');
              pdf.setFontSize(12);
              pdf.setFont("helvetica", "bold");
              pdf.setTextColor(0, 0, 0);
              pdf.text(`${cc} (${vehiclesInCC.length})`, 12, y);
              y += 10;

              vehiclesInCC.forEach(v => printRow(v));
              y += 5;
          });
      } else {
          filtered.forEach(v => printRow(v));
      }

      pdf.save(`flota_reporte_${viewMode.toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`);
      setShowExportMenu(false);
  };

  const handleEmail = () => {
      exportPDF(); // Auto download file first
      const subject = encodeURIComponent("Reporte de Flota Exportado");
      const body = encodeURIComponent("Adjunto encontrará el reporte de flota solicitado.\n\nNota: Por favor adjunte el archivo PDF que se acaba de descargar.");
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      setShowExportMenu(false);
  };
  
  const renderVehicleCard = (v: Vehicle) => {
    // Service/Maintenance logic
    // CALCULATE EFFECTIVE CURRENT KM (Manual vs Checklist)
    const vehicleChecklists = checklists.filter(c => c.vehiclePlate === v.plate);
    const lastChecklistKm = vehicleChecklists.length > 0 
        ? Math.max(...vehicleChecklists.map(c => c.km)) 
        : 0;
    
    // The "real" current KM is the max of manual input or latest checklist
    const effectiveKm = Math.max(v.currentKm, lastChecklistKm);
    const isKmFromChecklist = lastChecklistKm > v.currentKm;

    const remainingKm = v.nextServiceKm - effectiveKm;
    const isServiceOverdue = remainingKm < 0;
    const isServiceWarning = remainingKm >= 0 && remainingKm < 1000;
    
    // Interval for progress bar
    const interval = v.serviceIntervalKm || 10000;
    const lastServiceKm = v.lastServiceKm || 0;
    const kmDrivenSinceService = effectiveKm - lastServiceKm;
    
    // Progress % (If driven > interval, it's 100%+)
    const progressPercent = Math.min(100, Math.max(0, (kmDrivenSinceService / interval) * 100));

    const today = new Date();
    today.setHours(0,0,0,0);

    // --- DOCUMENT ANALYSIS LOGIC ---
    const docStatusList = v.documents
        .filter(d => d.expirationDate) // Only care about docs with expiration
        .map(d => {
            const exp = new Date(d.expirationDate!);
            // Handle timezone/date string parsing properly by normalizing 'today'
            const diffTime = exp.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return {
                ...d,
                diffDays,
                status: diffDays < 0 ? 'EXPIRED' : diffDays <= 30 ? 'WARNING' : 'OK'
            };
        })
        .sort((a,b) => a.diffDays - b.diffDays); // Sort by most urgent

    const isInactive = v.status === VehicleStatus.INACTIVE;

    return (
      <div key={v.plate} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col group hover:shadow-md transition-shadow 
          ${isInactive
              ? 'border-l-8 border-l-slate-400 opacity-90'
              : isServiceOverdue 
                  ? 'border-l-8 border-l-red-600 border-red-300 ring-1 ring-red-100' 
                  : isServiceWarning 
                      ? 'border-l-8 border-l-yellow-400 border-yellow-300 ring-1 ring-yellow-100'
                      : 'border-l-8 border-l-slate-200 border-slate-200'
          }
      `}>
        <div 
            className={`h-48 relative cursor-pointer overflow-hidden ${isInactive ? 'grayscale' : ''}`}
            onClick={() => navigate(`/vehicles/${v.plate}`)}
            title="Ver detalle completo de la unidad"
        >
          {v.images.front ? (
            <img 
                src={v.images.front} 
                alt={v.model} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">Sin Imagen</div>
          )}
          
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold z-10 shadow-sm ${v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : v.status === 'INACTIVE' ? 'bg-slate-700 text-white' : 'bg-orange-100 text-orange-700'}`}>
            {getVehicleStatusLabel(v.status)}
          </div>

          {v.syncStatus === 'PENDING' && (
              <div className="absolute top-2 right-24 px-2 py-1 rounded text-xs font-bold z-10 shadow-sm bg-yellow-400 text-black flex items-center gap-1">
                  <LucideCloudOff size={12}/> Pendiente
              </div>
          )}

          {v.ownership !== OwnershipType.OWNED && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-bold z-10 shadow-sm bg-purple-100 text-purple-700 flex items-center gap-1 border border-purple-200 uppercase">
                  <LucideBriefcase size={12}/> {getOwnershipLabel(v.ownership)}
              </div>
          )}

          {!isInactive && (
            <div className="absolute bottom-2 left-2 flex flex-col gap-1 items-start max-w-[90%]">
                {isServiceOverdue && (
                    <div className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold shadow-sm flex items-center gap-1 animate-pulse border border-red-800">
                        <LucideAlertOctagon size={12} /> SERVICIO VENCIDO
                    </div>
                )}
                {isServiceWarning && !isServiceOverdue && (
                    <div className="px-2 py-1 rounded bg-yellow-400 text-slate-900 text-xs font-bold shadow-sm flex items-center gap-1 border border-yellow-500">
                        <LucideAlertTriangle size={12} /> SERVICE PRÓXIMO
                    </div>
                )}
            </div>
          )}
          
          {isInactive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="bg-slate-800 text-white px-3 py-1 rounded font-bold uppercase text-sm border border-slate-600 shadow-xl">
                      Unidad Devuelta
                  </div>
              </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Ver Detalle
              </span>
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">{v.make} {v.model}</h3>
                {!isInactive && isServiceOverdue && (
                    <span className="flex items-center gap-1 bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-red-200">
                       <LucideAlertOctagon size={12} /> VENCIDO
                    </span>
                )}
                {!isInactive && isServiceWarning && !isServiceOverdue && (
                    <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-[10px] px-2 py-0.5 rounded-full font-bold border border-yellow-200">
                        <LucideAlertTriangle size={12} /> PRÓXIMO
                    </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-mono bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{v.plate}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium text-slate-600">{v.year}</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {v.rentalProvider && (
                 <div className="flex justify-between border-b border-slate-50 pb-1 text-purple-700">
                    <span>Proveedor:</span>
                    <span className="font-bold truncate max-w-[120px]">{v.rentalProvider}</span>
                 </div>
            )}
            
            <div className="flex justify-between border-b border-slate-50 pb-1">
              <span>Kilometraje:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                  {effectiveKm.toLocaleString()} km
                  {isKmFromChecklist && (
                      <span title="Actualizado vía Checklist" className="flex items-center">
                          <LucideSmartphone size={12} className="text-blue-500" />
                      </span>
                  )}
              </span>
            </div>
            
            {!isInactive && (
                <div className={`flex flex-col border-b border-slate-50 pb-1 ${isServiceOverdue ? 'bg-red-50 -mx-4 px-4 py-2 border-red-100' : isServiceWarning ? 'bg-yellow-50 -mx-4 px-4 py-2 border-yellow-100' : ''}`}>
                    <div className="flex justify-between items-center">
                        <span className={isServiceOverdue ? 'text-red-800 font-bold' : isServiceWarning ? 'text-yellow-800 font-bold' : ''}>Próximo Service:</span>
                        <div className="flex items-center gap-1">
                            <span className={`font-medium ${isServiceOverdue ? 'text-red-600 font-bold' : isServiceWarning ? 'text-yellow-600 font-bold' : 'text-slate-800'}`}>
                                {v.nextServiceKm.toLocaleString()} km
                            </span>
                        </div>
                    </div>
                    {/* EXTRA DETAIL FOR SERVICE: EXCEEDED OR REMAINING */}
                    <div className="text-right mt-1">
                        {isServiceOverdue ? (
                            <span className="text-xs font-bold text-red-600 uppercase flex justify-end items-center gap-1">
                                <LucideAlertOctagon size={12}/> Excedido por {Math.abs(remainingKm).toLocaleString()} km
                            </span>
                        ) : (
                            <span className="text-xs font-bold text-green-600 uppercase flex justify-end items-center gap-1">
                                <LucideCheckCircle size={12}/> Faltan {remainingKm.toLocaleString()} km
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* --- DOCUMENT EXPIRATION LIST --- */}
            {!isInactive && docStatusList.length > 0 && (
                <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Vencimientos de Documentación</p>
                    <div className="space-y-1">
                        {docStatusList.map(doc => {
                            let statusClasses = '';
                            let statusText = '';
                            let icon = null;

                            if (doc.status === 'EXPIRED') {
                                statusClasses = 'bg-red-50 text-red-700 border-red-200';
                                statusText = `Vencido: ${doc.expirationDate}`;
                                icon = <LucideAlertOctagon size={12} className="text-red-600 shrink-0"/>;
                            } else if (doc.status === 'WARNING') {
                                statusClasses = 'bg-yellow-50 text-yellow-800 border-yellow-200';
                                statusText = `Vence: ${doc.expirationDate}`;
                                icon = <LucideAlertTriangle size={12} className="text-yellow-600 shrink-0"/>;
                            } else {
                                statusClasses = 'bg-green-50 text-green-700 border-green-200';
                                statusText = `Vence: ${doc.expirationDate}`;
                                icon = <LucideCheckCircle size={12} className="text-green-600 shrink-0"/>;
                            }

                            // Calculate Days Label
                            const daysLabel = doc.diffDays < 0 
                                ? `Hace ${Math.abs(doc.diffDays)} días` 
                                : `Faltan ${doc.diffDays} días`;

                            return (
                                <div key={doc.id} className={`flex items-center justify-between text-[10px] px-2 py-1.5 rounded border ${statusClasses}`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {icon}
                                        <div className="flex flex-col truncate">
                                            <span className="font-bold truncate">
                                                {doc.type === 'INSURANCE' ? 'Seguro' : 
                                                 doc.type === 'VTV_RTO' ? 'VTV/RTO' : 
                                                 doc.type === 'TITLE' ? 'Cédula' :
                                                 doc.type === 'IDENTIFICATION' ? 'Identificación' :
                                                 doc.type === 'OTHER' ? doc.name : 
                                                 doc.type}
                                            </span>
                                            <span>{statusText} <span className="font-bold">({daysLabel})</span></span>
                                        </div>
                                    </div>
                                    {/* Edit Icon - Only visible to Admins/Managers */}
                                    {canManageFleet && (
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate(`/vehicles/${v.plate}`);
                                            }}
                                            className="ml-2 p-1 bg-white border border-slate-300 rounded text-slate-500 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-sm"
                                            title="Editar Documento"
                                        >
                                            <LucidePencil size={10} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {!isInactive && (
                <div className="mt-2 pt-1">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ciclo de Mantenimiento</span>
                        <span className={`text-[10px] font-bold ${isServiceOverdue ? 'text-red-600' : 'text-slate-500'}`}>
                            {isServiceOverdue ? 'Excedido' : `${Math.round(progressPercent)}%`}
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                isServiceOverdue ? 'bg-red-600 animate-pulse' : 
                                isServiceWarning ? 'bg-yellow-400' : 'bg-blue-500'
                            }`} 
                            style={{ width: `${isServiceOverdue ? 100 : progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {isInactive && v.rentalEndDate && (
                <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50 -mx-4 px-4 pb-2 text-center">
                    <p className="text-xs font-bold text-slate-500 uppercase">Fecha Devolución</p>
                    <p className="font-bold text-slate-800">{new Date(v.rentalEndDate).toLocaleDateString()}</p>
                </div>
            )}

            {v.costCenter && !groupByCostCenter && (
                 <div className="flex justify-between border-b border-slate-50 pb-1 pt-2">
                    <span>Centro Costo:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[120px]" title={v.costCenter}>{v.costCenter}</span>
                 </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
          {canManageFleet ? (
              <Link to={`/vehicles/${v.plate}`} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 py-2 rounded border border-slate-200 text-slate-700 text-sm font-medium transition-colors shadow-sm">
                <LucideEdit size={16} /> {isInactive ? 'Ver / Reactivar' : 'Editar'}
              </Link>
          ) : (
              <Link to={`/vehicles/${v.plate}`} className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 py-2 rounded border border-slate-200 text-slate-700 text-sm font-medium transition-colors shadow-sm">
                <LucideEye size={16} /> Ver Detalle
              </Link>
          )}
          
          {!isInactive && (
            <Link to={`/checklist?plate=${v.plate}`} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-2 rounded border border-transparent text-white text-sm font-medium transition-colors shadow-sm">
                <LucideFileText size={16} /> Checklist
            </Link>
          )}
          
          {canManageFleet && (
             // DELETE BUTTON: ONLY VISIBLE FOR MAIN ADMIN
             isMainAdmin ? (
                 <button
                    onClick={(e) => handleDelete(e, v)}
                    className={`p-2 bg-white border rounded transition-colors shadow-sm flex items-center justify-center ${
                        isInactive 
                        ? 'border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700' 
                        : 'border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-600'
                    }`}
                    title={isInactive ? "Eliminar Definitivamente" : "Dar de Baja / Archivar"}
                 >
                    {isInactive ? <LucideTrash2 size={16} /> : <LucideArchive size={16} />}
                 </button>
             ) : (
                 // Placeholder for layout balance or strictly hidden
                 null
             )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative">
      <ConfirmationModal 
          isOpen={modalConfig.isOpen} 
          title={modalConfig.title} 
          message={modalConfig.message} 
          onConfirm={modalConfig.onConfirm} 
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
      />

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="flex items-center gap-3">
             {viewMode === 'HISTORY' && (
                 <button onClick={() => setViewMode('ACTIVE')} className="p-2 rounded-full hover:bg-slate-200 text-slate-600">
                     <LucideArrowLeft />
                 </button>
             )}
             <h1 className="text-2xl font-bold flex items-center gap-2">
                 {viewMode === 'ACTIVE' ? (
                     <>Flota de Vehículos <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 rounded-full">{filtered.length}</span></>
                 ) : (
                     <><LucideArchive className="text-slate-500"/> Historial / Devoluciones <span className="text-sm font-normal text-slate-500 bg-slate-200 px-2 rounded-full">{filtered.length}</span></>
                 )}
             </h1>
             {userCostCenter && (
                 <div className="flex flex-col items-start bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-lg">
                     <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1"><LucideLock size={10}/> Vista Restringida</span>
                     <span className="text-sm font-bold flex items-center gap-1">
                         <LucideBuilding2 size={14}/> {userCostCenter}
                     </span>
                 </div>
             )}
        </div>
        
        {/* FILTERS TOOLBAR */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto flex-wrap">
          
          <div className="flex bg-slate-200 p-1 rounded-lg">
               <button 
                   onClick={() => setViewMode('ACTIVE')} 
                   className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'ACTIVE' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
               >
                   <LucideActivity size={16}/> Activos
               </button>
               <button 
                   onClick={() => setViewMode('HISTORY')} 
                   className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'HISTORY' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
               >
                   <LucideHistory size={16}/> Histórico
               </button>
          </div>

          {viewMode === 'ACTIVE' && (
            <div className="relative w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LucideActivity size={16} className="text-slate-400" />
                </div>
                <select 
                    className="w-full md:w-40 pl-9 pr-3 py-2 rounded-lg border bg-white border-slate-300 text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    title="Filtrar por Estado"
                >
                    <option value="">Estado: Todos</option>
                    <option value={VehicleStatus.ACTIVE}>Activo</option>
                    <option value={VehicleStatus.MAINTENANCE}>En Taller</option>
                </select>
            </div>
          )}

          {/* Cost Center Filter - Only shown if user is NOT restricted to a single Cost Center */}
          {!userCostCenter && (
              <div className="relative w-full md:w-auto">
                  <button 
                      onClick={() => setIsCCOpen(!isCCOpen)}
                      className="w-full md:w-48 pl-9 pr-3 py-2 rounded-lg border bg-white border-slate-300 text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                      title="Filtrar por Centro de Costo (Selección Múltiple)"
                  >
                      <div className="flex items-center gap-2 overflow-hidden">
                          <LucideFilter size={16} className="text-slate-400 shrink-0 absolute left-3" />
                          <span className="truncate">
                              {filterCostCenters.length === 0 
                                  ? "Todos los CC" 
                                  : filterCostCenters.length === 1 
                                      ? filterCostCenters[0] 
                                      : `${filterCostCenters.length} CC Selecc.`
                              }
                          </span>
                      </div>
                      <LucideChevronDown size={14} className="text-slate-400"/>
                  </button>
                  
                  {isCCOpen && (
                      <div className="fixed inset-0 z-40" onClick={() => setIsCCOpen(false)}></div>
                  )}

                  {isCCOpen && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto">
                          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-500 uppercase">Seleccionar Centros</span>
                              <button onClick={toggleAllCostCenters} className="text-xs text-blue-600 font-bold hover:underline">
                                  {filterCostCenters.length === uniqueCostCenters.length ? 'Limpiar' : 'Todos'}
                              </button>
                          </div>
                          <div className="space-y-1">
                              {uniqueCostCenters.map(cc => (
                                  <div 
                                      key={cc as string} 
                                      onClick={() => toggleCostCenter(cc as string)}
                                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                                  >
                                      <input 
                                          type="checkbox" 
                                          checked={filterCostCenters.includes(cc as string)} 
                                          onChange={() => {}} 
                                          className="rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                                      />
                                      <span className="text-sm text-slate-700 truncate">{cc}</span>
                                  </div>
                              ))}
                              {uniqueCostCenters.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No hay centros de costo.</p>}
                          </div>
                      </div>
                  )}
              </div>
          )}

          <div className="relative w-full md:w-auto flex items-center gap-1">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LucideBriefcase size={16} className="text-slate-400" />
                </div>
                {filterOwnership === '__CUSTOM__' ? (
                    <div className="flex gap-1">
                        <input 
                            type="text" 
                            className="w-full md:w-40 pl-9 pr-8 py-2 rounded-lg border bg-white border-blue-300 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Escriba..."
                            value={customOwnership}
                            onChange={(e) => setCustomOwnership(e.target.value)}
                            autoFocus
                        />
                         <button 
                            onClick={() => { setFilterOwnership('ALL'); setCustomOwnership(''); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                         >
                             <LucideX size={16} />
                         </button>
                    </div>
                ) : (
                    <select 
                        className="w-full md:w-40 pl-9 pr-3 py-2 rounded-lg border bg-white border-slate-300 text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={filterOwnership}
                        onChange={(e) => setFilterOwnership(e.target.value)}
                        title="Filtrar por Propiedad"
                    >
                        <option value="ALL">Propiedad: Todas</option>
                        <option value={OwnershipType.OWNED}>Propias</option>
                        <option value={OwnershipType.RENTED}>Alquiladas</option>
                        <option value={OwnershipType.LEASING}>Leasing</option>
                        {uniqueDynamicOwnerships.map(o => (
                            <option key={o} value={o}>{o}</option>
                        ))}
                        <option value="__CUSTOM__" className="font-bold text-blue-600 bg-blue-50">+ Agregar nueva...</option>
                    </select>
                )}
              </div>
          </div>

          {uniqueProviders.length > 0 && (
             <div className="relative w-full md:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LucideBuilding2 size={16} className="text-slate-400" />
                </div>
                <select 
                    className="w-full md:w-40 pl-9 pr-3 py-2 rounded-lg border bg-white border-slate-300 text-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={filterProvider}
                    onChange={(e) => setFilterProvider(e.target.value)}
                    title="Filtrar por Proveedor"
                >
                    <option value="">Todos los Prov.</option>
                    {uniqueProviders.map(p => (
                        <option key={p} value={p as string}>{p}</option>
                    ))}
                </select>
            </div>
          )}

          <button 
            onClick={() => setGroupByCostCenter(!groupByCostCenter)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${groupByCostCenter ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            title="Agrupar visualmente por Centro de Costo"
          >
             {groupByCostCenter ? <LucideLayers size={18}/> : <LucideLayoutGrid size={18} />}
             <span className="hidden lg:inline">{groupByCostCenter ? 'Desagrupar' : 'Agrupar por CC'}</span>
          </button>
          
          {canManageFleet && (
            <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white border-slate-300 text-slate-600 hover:bg-slate-50 text-sm font-medium"
                    title="Opciones de Exportación"
                >
                    <LucideDownload size={18} />
                </button>
                {showExportMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1">
                        <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                            <LucideFileSpreadsheet size={16} /> Exportar Excel/CSV
                        </button>
                        <button onClick={exportPDF} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2">
                            <LucideFileText size={16} /> Exportar PDF
                        </button>
                        <button onClick={handleEmail} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100">
                            <LucideMail size={16} /> Enviar por Email
                        </button>
                    </div>
                )}
            </div>
          )}

          <div className="relative flex-1 md:w-64 w-full">
            <LucideSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar patente..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {canManageFleet && viewMode === 'ACTIVE' && (
              <Link to="/vehicles/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto justify-center">
                <LucidePlus size={18} /> <span className="hidden lg:inline">Nueva Unidad</span>
                <span className="lg:hidden">Nueva</span>
              </Link>
          )}
        </div>
      </div>
      
      {viewMode === 'HISTORY' && (
          <div className="bg-slate-100 border-l-4 border-slate-500 p-4 rounded text-slate-700 flex items-center gap-3">
              <LucideArchive size={24} className="text-slate-500"/>
              <div>
                  <p className="font-bold">Modo Histórico / Archivo</p>
                  <p className="text-sm">Viendo unidades devueltas o dadas de baja. Para reactivar una unidad, ingrese al detalle y seleccione "Reactivar".</p>
              </div>
          </div>
      )}

      {filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400 text-lg">No se encontraron unidades en esta vista.</p>
              {userCostCenter && <p className="text-purple-600 font-bold mt-2">Filtro activo: Solo unidades de {userCostCenter}</p>}
              {viewMode === 'HISTORY' && <p className="text-slate-400 text-sm mt-2">Las unidades devueltas o inactivas aparecerán aquí.</p>}
          </div>
      ) : groupByCostCenter ? (
          <div className="space-y-8">
              {costCentersToRender.map(cc => {
                  const vehiclesInCC = filtered.filter(v => (v.costCenter || 'Sin Centro de Costo') === cc);
                  if (vehiclesInCC.length === 0) return null;
                  
                  return (
                      <div key={cc} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2 flex justify-between">
                              {cc}
                              <span className="text-sm font-normal bg-white px-2 py-0.5 rounded border text-slate-500">{vehiclesInCC.length} unidades</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {vehiclesInCC.map(v => renderVehicleCard(v))}
                          </div>
                      </div>
                  );
              })}
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(v => renderVehicleCard(v))}
          </div>
      )}
    </div>
  );
};
