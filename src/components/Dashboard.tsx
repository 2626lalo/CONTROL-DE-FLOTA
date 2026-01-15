
import React, { useMemo } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LucideAlertTriangle, LucideCheckCircle, LucideWrench, LucideAlertOctagon, LucideClipboardList, LucideUserPlus, LucideBuilding2, LucideRefreshCw, LucideSend, LucideMessageSquare } from 'lucide-react';
import { VehicleStatus, UserRole, ServiceStage, OwnershipType, User, Vehicle } from '../types';

export const Dashboard = () => {
  const { vehicles, serviceRequests, user, registeredUsers, refreshData, isDataLoading } = useApp();
  const navigate = useNavigate();

  // COST CENTER FILTERING
  const isAdmin = user?.role === UserRole.ADMIN;
  const userCostCenter = (!isAdmin && user?.costCenter) ? user.costCenter : null;

  // Filter vehicles first
  const filteredVehicles = vehicles.filter(v => {
      if (userCostCenter) {
          return v.costCenter === userCostCenter;
      }
      return true;
  });

  // Filter Service Requests based on the filtered vehicles
  const filteredRequests = serviceRequests.filter(req => {
      // Logic: Does the vehicle belong to my cost center?
      const vehicle = vehicles.find(v => v.plate === req.vehiclePlate);
      if (userCostCenter) {
          return vehicle?.costCenter === userCostCenter;
      }
      // If not strictly bound by Cost Center, follow standard access rules (Own vs All)
      if (isAdmin || user?.role === UserRole.MANAGER) return true;
      return req.userId === user?.id;
  });

  // Chart Data (Strict Status)
  const activeCount = filteredVehicles.filter(v => v.status === VehicleStatus.ACTIVE).length;
  const maintenanceCount = filteredVehicles.filter(v => v.status === VehicleStatus.MAINTENANCE).length;
  const inactiveCount = filteredVehicles.filter(v => v.status === VehicleStatus.INACTIVE).length;

  const dataStatus = [
    { name: 'Activos', value: activeCount, color: '#10b981' },
    { name: 'Taller', value: maintenanceCount, color: '#f59e0b' },
    { name: 'Inactivos', value: inactiveCount, color: '#ef4444' },
  ];

  // Logic for Rental Chart
  const rentalVehicles = filteredVehicles.filter(v => v.ownership === OwnershipType.RENTED);
  const rentalProvidersMap = rentalVehicles.reduce((acc: Record<string, number>, v) => {
      // If rented but no provider name, group as 'S/D'
      const provider = v.rentalProvider || 'S/D';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const rentalChartData = Object.entries(rentalProvidersMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Number(b.value) - Number(a.value)); // Sort descending

  // Calculate upcoming services
  const expiringDocs = filteredVehicles.flatMap(v => 
    v.documents.map(d => ({ ...d, vehicle: v.plate }))
  ).filter(d => {
    if(!d.expirationDate) return false;
    const days = (new Date(d.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return days < 30; // 30 days alert
  });

  const nextServices = filteredVehicles.filter(v => {
    const kmLeft = v.nextServiceKm - v.currentKm;
    // Show if negative (overdue) or less than 1000 (upcoming)
    return kmLeft < 1000;
  });

  // Calculate Pending Users (Admin Only)
  const pendingUsersCount = registeredUsers.filter(u => !u.approved).length;

  // Calculate Total Active Services (Regardless of vehicle status)
  const activeServiceCount = filteredRequests.filter(r => {
      return r.stage !== ServiceStage.DELIVERY && r.stage !== ServiceStage.CANCELLED;
  }).length;

  // Calculate specifically "REQUESTED" stage for the 4th card to distinguish it
  const newRequestsCount = filteredRequests.filter(r => r.stage === ServiceStage.REQUESTED).length;

  // --- AUTOMATED NOTIFICATION LOGIC ---
  const pendingNotifications = useMemo(() => {
      // Only users who have enabled 'receiveAlerts' and have a phone number
      const targets = registeredUsers.filter(u => u.receiveAlerts && u.approved && u.phone);
      
      const results: { user: User, message: string, count: number }[] = [];

      targets.forEach(targetUser => {
          // 1. Get vehicles relevant to this user (Cost Center Filter)
          const targetVehicles = vehicles.filter(v => {
              if (v.status === VehicleStatus.INACTIVE) return false;
              if (targetUser.costCenter && targetUser.costCenter !== v.costCenter) return false;
              return true;
          });

          let alertLines: string[] = [];

          // 2. Check for Alerts in those vehicles
          targetVehicles.forEach(v => {
              // A. Service Checks
              const kmLeft = v.nextServiceKm - v.currentKm;
              if (kmLeft < 0) {
                  alertLines.push(`🔴 *${v.plate}*: SERVICE VENCIDO por ${Math.abs(kmLeft)} km.`);
              } else if (kmLeft < 1000) {
                  alertLines.push(`⚠️ *${v.plate}*: Service próximo en ${kmLeft} km.`);
              }

              // B. Document Checks
              v.documents.forEach(d => {
                  if (d.expirationDate) {
                      const days = (new Date(d.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                      if (days < 0) {
                          alertLines.push(`⛔ *${v.plate}*: ${d.type} VENCIDO el ${d.expirationDate}.`);
                      } else if (days < 15) {
                          alertLines.push(`📅 *${v.plate}*: ${d.type} vence en ${Math.ceil(days)} días.`);
                      }
                  }
              });
          });

          if (alertLines.length > 0) {
              const header = `🤖 *ALERTA AUTOMÁTICA DE FLOTA*\nHola ${targetUser.name}, este es el reporte de novedades para tu centro de costo (${targetUser.costCenter || 'Global'}):\n\n`;
              const body = alertLines.join('\n');
              const footer = `\n\nPor favor gestionar en el sistema.`;
              
              results.push({
                  user: targetUser,
                  message: encodeURIComponent(header + body + footer),
                  count: alertLines.length
              });
          }
      });

      return results;
  }, [registeredUsers, vehicles]);

  const sendWhatsApp = (phone: string, text: string) => {
      // Remove any non-numeric chars from phone
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard de Flota</h1>
          <div className="flex items-center gap-2">
              {userCostCenter && (
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 border border-purple-200">
                      <LucideBuilding2 size={16}/> CC: {userCostCenter}
                  </span>
              )}
              <button 
                onClick={refreshData}
                disabled={isDataLoading}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-lg shadow-sm transition-all flex items-center gap-2"
                title="Refrescar Base de Datos"
              >
                  <LucideRefreshCw size={20} className={isDataLoading ? "animate-spin text-blue-600" : ""} />
                  {isDataLoading && <span className="text-sm font-bold text-blue-600 hidden md:inline">Actualizando...</span>}
              </button>
          </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* ADMIN ONLY: Pending Users */}
        {user?.role === UserRole.ADMIN && (
             <div 
               onClick={() => navigate('/users')}
               className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all ${pendingUsersCount > 0 ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}
             >
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-slate-500 font-medium">Validación Usuarios</p>
                   <h3 className={`text-2xl font-bold ${pendingUsersCount > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>{pendingUsersCount}</h3>
                   {pendingUsersCount > 0 ? (
                       <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold animate-pulse">REQUIERE ACCIÓN</span>
                   ) : (
                       <span className="text-[10px] text-slate-400">Al día</span>
                   )}
                 </div>
                 <div className={`p-3 rounded-lg ${pendingUsersCount > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                   <LucideUserPlus size={24} />
                 </div>
               </div>
             </div>
        )}

        {/* Total Units -> Vehicles List */}
        <div 
          onClick={() => navigate('/vehicles')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Unidades</p>
              <h3 className="text-2xl font-bold">{filteredVehicles.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <LucideCheckCircle size={24} />
            </div>
          </div>
        </div>

        {/* En Servicio -> Service Manager (Updated Logic) */}
        <div 
          onClick={() => navigate('/service')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">En Servicio</p>
              <h3 className="text-2xl font-bold">{activeServiceCount}</h3>
            </div>
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <LucideWrench size={24} />
            </div>
          </div>
        </div>

        {/* Alerts -> Vehicles List (To manage docs) */}
        <div 
          onClick={() => navigate('/vehicles')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Alertas Docs</p>
              <h3 className="text-2xl font-bold">{expiringDocs.length}</h3>
            </div>
            <div className="p-3 bg-red-100 text-red-600 rounded-lg">
              <LucideAlertTriangle size={24} />
            </div>
          </div>
        </div>
        
         {/* Requests -> Service Manager (Updated to show New/Requested specifically) */}
         <div 
           onClick={() => navigate('/service')}
           className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
         >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Nuevas Solicitudes</p>
              <h3 className="text-2xl font-bold">{newRequestsCount}</h3>
            </div>
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <LucideClipboardList size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP NOTIFICATION CENTER */}
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.ADMIN_L2) && pendingNotifications.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2 mb-3">
                  <LucideMessageSquare size={20}/> Centro de Notificaciones Automáticas (WhatsApp)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingNotifications.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-green-100 shadow-sm flex justify-between items-center">
                          <div>
                              <p className="font-bold text-slate-700">{item.user.name}</p>
                              <p className="text-xs text-slate-500">{item.user.costCenter || 'Global'}</p>
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-1 rounded">{item.count} Alertas</span>
                          </div>
                          <button 
                              onClick={() => sendWhatsApp(item.user.phone!, item.message)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                          >
                              <LucideSend size={16}/> Enviar
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* LEFT COLUMN: CHARTS */}
        <div className="space-y-6 min-w-0">
            {/* Status Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-lg mb-4 text-slate-700">Estado de la Flota</h3>
              {/* Added relative positioning and h-[300px] class for strict sizing */}
              <div className="w-full h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={dataStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rental Providers Chart (Only if there are rentals) */}
            {rentalChartData.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-semibold text-lg mb-4 text-indigo-900 flex items-center gap-2">
                        <LucideBuilding2 size={20}/> Unidades Alquiladas por Proveedor
                    </h3>
                    <div className="w-full h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart
                                data={rentalChartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={100} 
                                    tick={{fontSize: 11, fill: '#475569', fontWeight: 600}} 
                                />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar 
                                    dataKey="value" 
                                    fill="#6366f1" 
                                    radius={[0, 4, 4, 0]} 
                                    name="Unidades" 
                                    barSize={30}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: ALERTS LIST */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-y-auto max-h-[800px] min-w-0">
          <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
            <LucideAlertTriangle size={20}/> Alertas Prioritarias
          </h3>
          <div className="space-y-3">
             {nextServices.map((v, i) => {
                const kmLeft = v.nextServiceKm - v.currentKm;
                const isOverdue = kmLeft < 0;
                
                return (
                  <div key={`serv-${i}`} className={`flex justify-between items-center p-3 rounded border-l-4 ${isOverdue ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-400'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{v.plate} - {v.model}</p>
                          {isOverdue && <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">VENCIDO</span>}
                      </div>
                      <p className={`text-xs ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                          {isOverdue 
                            ? `Servicio vencido por ${Math.abs(kmLeft)} km` 
                            : `Próximo servicio en ${kmLeft} km`}
                      </p>
                    </div>
                    <button 
                        onClick={() => navigate('/service')} 
                        className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium text-slate-700 shadow-sm"
                    >
                        Agendar
                    </button>
                  </div>
                );
             })}
            {expiringDocs.map((d, i) => (
              <div key={`doc-${i}`} className="flex justify-between items-center p-3 bg-slate-50 rounded border-l-4 border-red-400">
                <div>
                  <p className="font-bold text-sm">{d.vehicle} - Documento</p>
                  <p className="text-xs text-slate-500">{d.type} vence el {d.expirationDate}</p>
                </div>
                <button 
                    onClick={() => navigate(`/vehicles/${d.vehicle}`)}
                    className="text-xs bg-white border border-slate-300 px-3 py-1.5 rounded hover:bg-slate-100 font-medium text-slate-700 shadow-sm"
                >
                    Actualizar
                </button>
              </div>
            ))}
            {nextServices.length === 0 && expiringDocs.length === 0 && (
                <p className="text-center text-slate-400 py-8">Todo está en orden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
