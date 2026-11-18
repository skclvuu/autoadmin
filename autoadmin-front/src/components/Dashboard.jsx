import { useState, useEffect } from 'react';

// Recibimos la función setVistaActual como prop
export default function Dashboard({ setVistaActual }) {
  const [stats, setStats] = useState({
    vehiculos: 0,
    en_diagnostico: 0,
    en_reparacion: 0,
    listos: 0,
    recientes: []
  });
  
  const [alertasStock, setAlertasStock] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resStats = await fetch('/api/dashboard/stats');
        const dataStats = await resStats.json();
        
        if (dataStats && !dataStats.error) {
          setStats(dataStats);
        }

        const resInv = await fetch('/api/inventario');
        const dataInv = await resInv.json();
        
        if (Array.isArray(dataInv)) {
          const criticos = dataInv.filter(item => item.estado === 'CRÍTICO');
          setAlertasStock(criticos);
        }

        setCargando(false);
      } catch (error) {
        console.error('Error cargando panel principal:', error);
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);

  const getBadgeStyle = (estado) => {
    switch (estado) {
      case 'Pendiente':
      case 'Ingresada':
        return { bg: '#fef3c7', text: '#d97706' };
      case 'En Proceso':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'Terminado':
        return { bg: '#d1fae5', text: '#059669' };
      default:
        return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const totalActivas = Number(stats.en_diagnostico) + Number(stats.en_reparacion) + Number(stats.listos);
  const getPorcentaje = (valor) => totalActivas === 0 ? 0 : Math.round((Number(valor) / totalActivas) * 100);

  if (cargando) return <p style={{ color: 'var(--text-muted)' }}>Cargando panel principal...</p>;

  return (
    <div style={{ paddingBottom: '40px' }}>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Resumen general del taller mecánico</p>

      {/* MÉTRICAS SUPERIORES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', borderLeft: '4px solid #64748b' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Vehículos</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#0f172a' }}>{stats.vehiculos}</h2>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', borderLeft: '4px solid #f59e0b' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Pendientes</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#0f172a' }}>{stats.en_diagnostico}</h2>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', borderLeft: '4px solid #3b82f6' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>En Proceso</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#0f172a' }}>{stats.en_reparacion}</h2>
        </div>

        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', borderLeft: '4px solid #10b981' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Terminados</p>
          <h2 style={{ margin: 0, fontSize: '32px', color: '#0f172a' }}>{stats.listos}</h2>
        </div>

      </div>

      {/* CONTENIDO INFERIOR A DOS COLUMNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* COLUMNA IZQUIERDA: Tabla de Órdenes Recientes */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a' }}>Órdenes Recientes</h3>
          {stats.recientes?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#64748b', fontSize: '14px' }}>
                  <th style={{ padding: '0 8px 12px 0', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Vehículo</th>
                  <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Cliente</th>
                  <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.recientes.map((orden) => {
                  const badge = getBadgeStyle(orden.estado);
                  return (
                    <tr key={orden.id_orden} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
                      <td style={{ padding: '16px 8px 16px 0', fontWeight: '600', color: '#3b82f6' }}>#{orden.id_orden}</td>
                      <td style={{ padding: '16px 8px', fontWeight: '600' }}>{orden.patente}</td>
                      <td style={{ padding: '16px 8px', color: '#475569' }}>{orden.cliente}</td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ 
                          backgroundColor: badge.bg, color: badge.text, 
                          padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' 
                        }}>
                          {orden.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No hay órdenes activas registradas.</p>
          )}
        </div>

        {/* COLUMNA DERECHA: Agrupa Flujo de Trabajo y Alertas de Stock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tarjeta 1: Flujo de Trabajo */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#0f172a' }}>Flujo de Trabajo</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                <span>Pendiente</span>
                <span>{getPorcentaje(stats.en_diagnostico)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '10px' }}>
                <div style={{ width: `${getPorcentaje(stats.en_diagnostico)}%`, backgroundColor: '#f59e0b', height: '10px', borderRadius: '999px' }}></div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                <span>En Proceso</span>
                <span>{getPorcentaje(stats.en_reparacion)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '10px' }}>
                <div style={{ width: `${getPorcentaje(stats.en_reparacion)}%`, backgroundColor: '#3b82f6', height: '10px', borderRadius: '999px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                <span>Terminado</span>
                <span>{getPorcentaje(stats.listos)}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', height: '10px' }}>
                <div style={{ width: `${getPorcentaje(stats.listos)}%`, backgroundColor: '#10b981', height: '10px', borderRadius: '999px' }}></div>
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Alertas de Stock Dinámicas */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              
              <h3 
                onClick={() => {
                  if (setVistaActual) setVistaActual('Inventario');
                }}
                style={{ margin: 0, fontSize: '18px', color: '#0f172a', cursor: 'pointer' }}
                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                title="Ir al módulo de Inventario"
              >
                Alertas de Stock
              </h3>

              {alertasStock.length > 0 && (
                <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  {alertasStock.length} Críticos
                </span>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alertasStock.length > 0 ? (
                alertasStock.slice(0, 4).map((repuesto, index) => (
                  <div key={repuesto.sku || index} style={{ paddingBottom: '12px', borderBottom: index < 3 && index < (alertasStock.length - 1) ? '1px solid #f1f5f9' : 'none' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{repuesto.nombre}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ef4444', fontWeight: '500' }}>
                      Stock actual: {repuesto.stock} (Mínimo: {repuesto.min})
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ margin: '10px 0', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                  El inventario está en niveles óptimos.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}