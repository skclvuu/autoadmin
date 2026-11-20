import { useState, useEffect } from 'react'

export default function Dashboard({ setVistaActual }) {
  const [vehiculos, setVehiculos] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [inventario, setInventario] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [mecanicos, setMecanicos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [resVeh, resOrd, resInv, resCot, resMec] = await Promise.all([
          fetch('/api/vehiculos'),
          fetch('/api/ordenes'),
          fetch('/api/inventario'),
          fetch('/api/cotizaciones'),
          fetch('/api/mecanicos')
        ])

        const [dataVeh, dataOrd, dataInv, dataCot, dataMec] = await Promise.all([
          resVeh.ok ? resVeh.json() : [],
          resOrd.ok ? resOrd.json() : [],
          resInv.ok ? resInv.json() : [],
          resCot.ok ? resCot.json() : [],
          resMec.ok ? resMec.json() : []
        ])

        setVehiculos(Array.isArray(dataVeh) ? dataVeh : [])
        setOrdenes(Array.isArray(dataOrd) ? dataOrd : [])
        setInventario(Array.isArray(dataInv) ? dataInv : [])
        setCotizaciones(Array.isArray(dataCot) ? dataCot : [])
        setMecanicos(Array.isArray(dataMec) ? dataMec : [])
      } catch (error) {
        console.error('Error cargando dashboard:', error)
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  // --- MÉTRICAS ÓRDENES ---
  const totalOrdenes = ordenes.length
  const pendientes = ordenes.filter(o => o.estado === 'Pendiente').length
  const enProceso = ordenes.filter(o => o.estado === 'En Proceso').length
  const terminados = ordenes.filter(o => o.estado === 'Terminado').length

  const ingresosTerminados = ordenes
    .filter(o => o.estado === 'Terminado')
    .reduce((acc, o) => acc + (Number(o.total_estimado) || 0), 0)

  const montoEnCurso = ordenes
    .filter(o => o.estado !== 'Terminado')
    .reduce((acc, o) => acc + (Number(o.total_estimado) || 0), 0)

  const pctPendiente = totalOrdenes ? Math.round((pendientes / totalOrdenes) * 100) : 0
  const pctProceso = totalOrdenes ? Math.round((enProceso / totalOrdenes) * 100) : 0
  const pctTerminado = totalOrdenes ? Math.round((terminados / totalOrdenes) * 100) : 0

  const ordenesRecientes = ordenes.slice(0, 6)
  const stockCritico = inventario.filter(item => Number(item.stock) <= Number(item.min))

  // --- MÉTRICAS COTIZACIONES ---
  const totalCotizaciones = cotizaciones.length
  const cotiEmitidas = cotizaciones.filter(c => c.estado === 'Emitida').length
  const cotiAprobadas = cotizaciones.filter(c => c.estado === 'Aprobada').length
  const cotiRechazadas = cotizaciones.filter(c => c.estado === 'Rechazada').length
  const tasaAprobacion = totalCotizaciones ? Math.round((cotiAprobadas / totalCotizaciones) * 100) : 0
  const montoAprobadoCoti = cotizaciones
    .filter(c => c.estado === 'Aprobada')
    .reduce((acc, c) => acc + (Number(c.total) || 0), 0)

  // --- CARGA POR MECÁNICO (ÓRDENES ACTIVAS) ---
  const ordenesActivas = ordenes.filter(o => o.estado !== 'Terminado')
  const cargaMecanicos = mecanicos.map(m => {
    const activas = ordenesActivas.filter(o => String(o.id_mecanico) === String(m.id_mecanico)).length
    return { id: m.id_mecanico, nombre: m.nombre, activas }
  })
  const sinAsignarCount = ordenesActivas.filter(o => !o.id_mecanico).length
  if (sinAsignarCount > 0) {
    cargaMecanicos.push({ id: 'sin-asignar', nombre: 'Sin asignar', activas: sinAsignarCount, sinAsignar: true })
  }
  cargaMecanicos.sort((a, b) => b.activas - a.activas)
  const maxCarga = Math.max(...cargaMecanicos.map(m => m.activas), 1)

  // --- INGRESOS ÚLTIMOS 6 MESES ---
  const ahora = new Date()
  const mesesIngresos = Array.from({ length: 6 }, (_, i) => {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - i), 1)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth()
    const etiqueta = fecha.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '')
    const total = ordenes
      .filter(o => {
        if (!o.fecha_ingreso) return false
        const f = new Date(o.fecha_ingreso)
        return f.getFullYear() === anio && f.getMonth() === mes
      })
      .reduce((acc, o) => acc + (Number(o.total_estimado) || 0), 0)
    return { etiqueta, total }
  })
  const maxIngresoMes = Math.max(...mesesIngresos.map(m => m.total), 1)

  const fechaHoy = ahora.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const formatearDinero = (monto) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto || 0)

  const formatearCompacto = (monto) => {
    if (monto >= 1000000) return `$${(monto / 1000000).toFixed(1)}M`
    if (monto >= 1000) return `$${Math.round(monto / 1000)}k`
    return `$${monto}`
  }

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' }
      case 'En Proceso': return { bg: '#dbeafe', text: '#1d4ed8', dot: '#2563eb' }
      case 'Terminado': return { bg: '#d1fae5', text: '#047857', dot: '#10b981' }
      default: return { bg: '#f1f5f9', text: '#475569', dot: '#64748b' }
    }
  }

  // --- CÁLCULO DONUT SVG ---
  const radio = 54
  const circunferencia = 2 * Math.PI * radio
  const segTerminado = (pctTerminado / 100) * circunferencia
  const segProceso = (pctProceso / 100) * circunferencia
  const segPendiente = (pctPendiente / 100) * circunferencia

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '14px',
    border: '1px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    padding: '22px'
  }

  const linkBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0
  }

  if (cargando) {
    return <p style={{ color: 'var(--text-muted)' }}>Cargando resumen del taller...</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Encabezado + Accesos Rápidos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px', textTransform: 'capitalize' }}>
          {fechaHoy}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {setVistaActual && (
            <>
              <button
                onClick={() => setVistaActual('Órdenes de trabajo')}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Nueva Orden
              </button>
              <button
                onClick={() => setVistaActual('Cotizaciones')}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Nueva Cotización
              </button>
            </>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: stockCritico.length > 0 ? '#fef2f2' : '#ecfdf5',
            color: stockCritico.length > 0 ? '#b91c1c' : '#047857',
            fontSize: '13px',
            fontWeight: '600',
            border: `1px solid ${stockCritico.length > 0 ? '#fecaca' : '#a7f3d0'}`
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: stockCritico.length > 0 ? '#ef4444' : '#10b981'
            }} />
            {stockCritico.length > 0
              ? `${stockCritico.length} repuestos en stock crítico`
              : 'Inventario óptimo'}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '18px' }}>
        {[
          {
            titulo: 'Vehículos',
            valor: vehiculos.length,
            subtitulo: 'Registrados en sistema',
            color: '#475569',
            bgIcon: '#f1f5f9',
            icono: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2" />
                <circle cx="6.5" cy="16.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
              </svg>
            )
          },
          {
            titulo: 'Pendientes',
            valor: pendientes,
            subtitulo: `${pctPendiente}% del total de órdenes`,
            color: '#d97706',
            bgIcon: '#fef3c7',
            icono: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            )
          },
          {
            titulo: 'En Proceso',
            valor: enProceso,
            subtitulo: `${pctProceso}% actualmente en taller`,
            color: '#2563eb',
            bgIcon: '#dbeafe',
            icono: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6a1.5 1.5 0 0 0 2.1 2.1l5.6-5.6a4 4 0 0 0 5.4-5.4l-2.2 2.2-2.1-2.1 2.2-2.2z" />
              </svg>
            )
          },
          {
            titulo: 'Terminados',
            valor: terminados,
            subtitulo: `${pctTerminado}% tasa de finalización`,
            color: '#059669',
            bgIcon: '#d1fae5',
            icono: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )
          },
          {
            titulo: 'Ingresos',
            valor: formatearDinero(ingresosTerminados),
            subtitulo: `${formatearDinero(montoEnCurso)} en curso`,
            color: '#7c3aed',
            bgIcon: '#ede9fe',
            icono: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            )
          }
        ].map((kpi, idx) => (
          <div key={idx} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {kpi.titulo}
              </span>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: kpi.bgIcon,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {kpi.icono}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.1 }}>
                {kpi.valor}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                {kpi.subtitulo}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cuerpo Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Órdenes Recientes */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>Órdenes Recientes</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Últimos {ordenesRecientes.length} ingresos al taller
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>
                  {totalOrdenes} totales
                </span>
                {setVistaActual && (
                  <button onClick={() => setVistaActual('Órdenes de trabajo')} style={linkBtnStyle}>
                    Ver todo →
                  </button>
                )}
              </div>
            </div>

            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>OT</th>
                    <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Vehículo / Cliente</th>
                    <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Mecánico</th>
                    <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Estimado</th>
                    <th style={{ padding: '0 8px 12px 8px', fontWeight: '600' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesRecientes.length > 0 ? ordenesRecientes.map((orden) => {
                    const est = obtenerColorEstado(orden.estado)
                    return (
                      <tr key={orden.id_orden} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                        <td style={{ padding: '14px 8px', fontWeight: '700', color: '#2563eb' }}>
                          #{orden.id_orden}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{orden.patente}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{orden.nombre_cliente}</div>
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-main)', fontSize: '13px' }}>
                          {orden.nombre_mecanico || <span style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                        </td>
                        <td style={{ padding: '14px 8px', fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>
                          {formatearDinero(orden.total_estimado)}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: est.bg,
                            color: est.text,
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: est.dot }} />
                            {orden.estado}
                          </span>
                        </td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No hay órdenes registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico de Barras: Ingresos por Mes */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>Ingresos Mensuales</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Total estimado de órdenes en los últimos 6 meses
                </p>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#7c3aed' }}>
                {formatearDinero(mesesIngresos.reduce((a, b) => a + b.total, 0))}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', height: '160px', paddingTop: '20px' }}>
              {mesesIngresos.map((m, idx) => {
                const alturaPct = m.total > 0 ? Math.max(8, Math.round((m.total / maxIngresoMes) * 100)) : 3
                const esMesActual = idx === mesesIngresos.length - 1
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)' }}>
                      {m.total > 0 ? formatearCompacto(m.total) : '$0'}
                    </span>
                    <div
                      title={`${m.etiqueta}: ${formatearDinero(m.total)}`}
                      style={{
                        width: '100%',
                        maxWidth: '42px',
                        height: `${alturaPct}%`,
                        backgroundColor: esMesActual ? '#2563eb' : '#cbd5e1',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s ease'
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: esMesActual ? '700' : '500', color: esMesActual ? 'var(--text-main)' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {m.etiqueta}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Carga de Trabajo por Mecánico */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>Carga por Mecánico</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Órdenes activas (pendientes y en proceso)
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                {ordenesActivas.length} activas
              </span>
            </div>

            {cargaMecanicos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {cargaMecanicos.map((m) => {
                  const ancho = Math.round((m.activas / maxCarga) * 100)
                  return (
                    <div key={m.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '600', color: m.sinAsignar ? '#b45309' : 'var(--text-main)' }}>
                          {m.nombre}
                        </span>
                        <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>
                          {m.activas} {m.activas === 1 ? 'orden' : 'órdenes'}
                        </span>
                      </div>
                      <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${m.activas > 0 ? Math.max(6, ancho) : 0}%`,
                          backgroundColor: m.sinAsignar ? '#f59e0b' : '#2563eb',
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                No hay mecánicos registrados.
              </p>
            )}
          </div>

        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Flujo de Trabajo con Gráfico Donut */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '17px', color: 'var(--text-main)' }}>Flujo de Trabajo</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ position: 'relative', width: '136px', height: '136px' }}>
                <svg width="136" height="136" viewBox="0 0 136 136" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="68" cy="68" r={radio} fill="none" stroke="#e2e8f0" strokeWidth="14" />
                  <circle
                    cx="68" cy="68" r={radio} fill="none"
                    stroke="#10b981" strokeWidth="14"
                    strokeDasharray={`${segTerminado} ${circunferencia}`}
                    strokeDashoffset={0}
                  />
                  <circle
                    cx="68" cy="68" r={radio} fill="none"
                    stroke="#2563eb" strokeWidth="14"
                    strokeDasharray={`${segProceso} ${circunferencia}`}
                    strokeDashoffset={-segTerminado}
                  />
                  <circle
                    cx="68" cy="68" r={radio} fill="none"
                    stroke="#f59e0b" strokeWidth="14"
                    strokeDasharray={`${segPendiente} ${circunferencia}`}
                    strokeDashoffset={-(segTerminado + segProceso)}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{totalOrdenes}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Órdenes</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '150px' }}>
                {[
                  { label: 'Terminado', count: terminados, pct: pctTerminado, color: '#10b981' },
                  { label: 'En Proceso', count: enProceso, pct: pctProceso, color: '#2563eb' },
                  { label: 'Pendiente', count: pendientes, pct: pctPendiente, color: '#f59e0b' }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: item.color }} />
                      <span>{item.label}</span>
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {item.count} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({item.pct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen de Cotizaciones */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>Cotizaciones</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Tasa de aprobación: <strong>{tasaAprobacion}%</strong>
                </p>
              </div>
              {setVistaActual && (
                <button onClick={() => setVistaActual('Cotizaciones')} style={linkBtnStyle}>
                  Ver todo →
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Emitidas', count: cotiEmitidas, bg: '#ffedd5', text: '#c2410c' },
                { label: 'Aprobadas', count: cotiAprobadas, bg: '#dbeafe', text: '#1d4ed8' },
                { label: 'Rechazadas', count: cotiRechazadas, bg: '#fee2e2', text: '#b91c1c' }
              ].map((c, idx) => (
                <div key={idx} style={{ backgroundColor: c.bg, borderRadius: '10px', padding: '12px 10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: c.text }}>{c.count}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: c.text, marginTop: '2px' }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Monto aprobado</span>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{formatearDinero(montoAprobadoCoti)}</span>
            </div>
          </div>

          {/* Alertas de Stock */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: 'var(--text-main)' }}>Alertas de Stock</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  backgroundColor: stockCritico.length > 0 ? '#fee2e2' : '#d1fae5',
                  color: stockCritico.length > 0 ? '#b91c1c' : '#047857',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {stockCritico.length} Críticos
                </span>
                {setVistaActual && (
                  <button onClick={() => setVistaActual('Inventario')} style={linkBtnStyle}>
                    Ver todo →
                  </button>
                )}
              </div>
            </div>

            {stockCritico.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stockCritico.slice(0, 5).map((item, i) => {
                  const porcentaje = Math.min(100, Math.round((Number(item.stock) / Math.max(1, Number(item.min))) * 100))
                  return (
                    <div key={i} style={{ paddingBottom: '12px', borderBottom: i < Math.min(stockCritico.length, 5) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{item.nombre}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
                          {item.stock} / {item.min}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        {item.sku} · {item.ubi || 'Sin ubicación'}
                      </div>
                      <div style={{ height: '6px', width: '100%', backgroundColor: '#fee2e2', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${porcentaje}%`, backgroundColor: '#ef4444', borderRadius: '999px' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                Todos los repuestos tienen stock sobre el mínimo.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}