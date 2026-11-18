import { useState, useEffect } from 'react'

export default function OrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [formulario, setFormulario] = useState({
    id_vehiculo: '', descripcion_falla: '', total_estimado: ''
  })

  const [editandoId, setEditandoId] = useState(null)
  const [datosEditados, setDatosEditados] = useState({
    estado: '', total_estimado: '', descripcion_falla: ''
  })

  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  // NUEVO ESTADO: Controla qué pestaña estamos viendo
  const [vistaActiva, setVistaActiva] = useState('activas') // 'activas' o 'historial'
  const ordenesPorPagina = 20

  const cargarDatos = async () => {
    try {
      const resOrdenes = await fetch('/api/ordenes')
      const dataOrdenes = await resOrdenes.json()
      setOrdenes(dataOrdenes)

      const resVehiculos = await fetch('/api/vehiculos')
      const dataVehiculos = await resVehiculos.json()
      setVehiculos(dataVehiculos)
      
      setCargando(false)
    } catch (error) {
      console.error('Error conectando al backend:', error)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const manejarCambioEdicion = (e) => {
    setDatosEditados({ ...datosEditados, [e.target.name]: e.target.value })
  }

  const guardarOrden = async (e) => {
    e.preventDefault()
    try {
      const respuesta = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })
      if (respuesta.ok) {
        setFormulario({ id_vehiculo: '', descripcion_falla: '', total_estimado: '' })
        cargarDatos()
        // Si creas una nueva, te lleva a la vista de activas automáticamente
        setVistaActiva('activas')
      }
    } catch (error) {
      console.error('Error en POST:', error)
    }
  }

  const iniciarEdicion = (orden) => {
    setEditandoId(orden.id_orden)
    setDatosEditados({
      estado: orden.estado,
      total_estimado: orden.total_estimado,
      descripcion_falla: orden.descripcion_falla
    })
  }

  const guardarEdicion = async (id) => {
    try {
      const respuesta = await fetch(`/api/ordenes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados)
      })
      if (respuesta.ok) {
        setEditandoId(null)
        cargarDatos()
      }
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  // --- LÓGICA DE PESTAÑAS, FILTRADO Y PAGINACIÓN ---
  
  // 1. Primero filtramos por la pestaña seleccionada (Activas vs Terminadas)
  const ordenesPorPestana = ordenes.filter(orden => {
    if (vistaActiva === 'activas') return orden.estado !== 'Terminado';
    return orden.estado === 'Terminado';
  });

  // 2. Luego aplicamos el buscador sobre esa lista
  const ordenesFiltradas = ordenesPorPestana.filter(orden => 
    orden.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
    orden.estado.toLowerCase().includes(busqueda.toLowerCase()) ||
    orden.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalPaginas = Math.ceil(ordenesFiltradas.length / ordenesPorPagina)
  const ordenesPaginadas = ordenesFiltradas.slice((paginaActual - 1) * ordenesPorPagina, paginaActual * ordenesPorPagina)

  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)
  }

  const obtenerColorEstado = (estado) => {
    switch(estado) {
      case 'Pendiente': return { bg: '#fee2e2', text: '#b91c1c' }
      case 'En Proceso': return { bg: '#fef3c7', text: '#b45309' }
      case 'Terminado': return { bg: '#d1fae5', text: '#047857' }
      default: return { bg: '#f1f5f9', text: '#475569' }
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '6px', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-main)', backgroundColor: 'transparent', boxSizing: 'border-box' }
  const editInputStyle = { ...inputStyle, padding: '4px 8px', marginTop: '0', border: '1px solid #2563eb' }

  // Estilo base para los botones de las pestañas
  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    backgroundColor: 'transparent',
    color: isActive ? '#2563eb' : 'var(--text-muted)',
    fontWeight: isActive ? '600' : '500',
    cursor: 'pointer',
    fontSize: '15px',
    transition: 'all 0.2s'
  })

  return (
    <>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Control de reparaciones y estados de taller</p>
      
      {/* Formulario */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--text-main)' }}>Ingresar Orden de Trabajo</h3>
        <form onSubmit={guardarOrden}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Vehículo</label>
              <select name="id_vehiculo" value={formulario.id_vehiculo} onChange={manejarCambio} required style={inputStyle}>
                <option value="">Seleccione patente...</option>
                {vehiculos.map(v => (
                  <option key={v.id_vehiculo} value={v.id_vehiculo}>{v.patente} - {v.marca} {v.modelo}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Falla Reportada</label>
              <input type="text" name="descripcion_falla" value={formulario.descripcion_falla} onChange={manejarCambio} required placeholder="Describa el problema..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Presupuesto Estimado</label>
              <input type="number" name="total_estimado" value={formulario.total_estimado} onChange={manejarCambio} placeholder="Ej: 50000" style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Generar Orden</button>
        </form>
      </div>

      {/* Tabla con Sistema de Pestañas */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
        
        {/* Selector de Pestañas y Buscador */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => { setVistaActiva('activas'); setPaginaActual(1); }} 
              style={tabStyle(vistaActiva === 'activas')}
            >
              Órdenes Activas
            </button>
            <button 
              onClick={() => { setVistaActiva('historial'); setPaginaActual(1); }} 
              style={tabStyle(vistaActiva === 'historial')}
            >
              Historial (Terminadas)
            </button>
          </div>
          
          <div style={{ paddingBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="Buscar patente o cliente..." 
              value={busqueda} 
              onChange={(e) => {setBusqueda(e.target.value); setPaginaActual(1)}} 
              style={{ ...inputStyle, width: '250px', marginTop: 0 }} 
            />
          </div>
        </div>
        
        {cargando ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando órdenes...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>N° Orden</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Vehículo / Cliente</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '30%' }}>Detalle Falla</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Total ($)</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '160px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenesPaginadas.length > 0 ? (
                  ordenesPaginadas.map((orden) => {
                    const colores = obtenerColorEstado(orden.estado)
                    return (
                      <tr key={orden.id_orden} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                        <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>#{orden.id_orden}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ fontWeight: '500' }}>{orden.patente}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{orden.nombre_cliente}</div>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === orden.id_orden ? <input type="text" name="descripcion_falla" value={datosEditados.descripcion_falla} onChange={manejarCambioEdicion} style={editInputStyle} /> : orden.descripcion_falla}
                        </td>
                        <td style={{ padding: '16px 8px', fontWeight: '500' }}>
                          {editandoId === orden.id_orden ? <input type="number" name="total_estimado" value={datosEditados.total_estimado} onChange={manejarCambioEdicion} style={editInputStyle} /> : formatearDinero(orden.total_estimado)}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === orden.id_orden ? (
                            <select name="estado" value={datosEditados.estado} onChange={manejarCambioEdicion} style={editInputStyle}>
                              <option value="Pendiente">Pendiente</option>
                              <option value="En Proceso">En Proceso</option>
                              <option value="Terminado">Terminado</option>
                            </select>
                          ) : (
                            <span style={{ backgroundColor: colores.bg, color: colores.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{orden.estado}</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === orden.id_orden ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => guardarEdicion(orden.id_orden)} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Guardar</button>
                              <button onClick={() => setEditandoId(null)} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cancelar</button>
                            </div>
                          ) : (
                            <button onClick={() => iniciarEdicion(orden)} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Editar</button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay órdenes en esta categoría.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button key={num} onClick={() => setPaginaActual(num)} style={{ padding: '6px 12px', borderRadius: '6px', border: num === paginaActual ? 'none' : '1px solid var(--border-color)', backgroundColor: num === paginaActual ? '#2563eb' : 'transparent', color: num === paginaActual ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
                    {num}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}