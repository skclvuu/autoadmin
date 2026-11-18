import { useState, useEffect } from 'react'

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([]) // Necesario para el selector de dueños
  const [cargando, setCargando] = useState(true)
  
  const [formulario, setFormulario] = useState({
    patente: '', marca: '', modelo: '', anio: '', id_cliente: ''
  })

  const [editandoId, setEditandoId] = useState(null)
  const [datosEditados, setDatosEditados] = useState({
    patente: '', marca: '', modelo: '', anio: '', id_cliente: ''
  })

  const [busquedaPatente, setBusquedaPatente] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const vehiculosPorPagina = 20

  const cargarDatos = async () => {
    try {
      // Cargamos vehículos y clientes al mismo tiempo
      const resVehiculos = await fetch('/api/vehiculos')
      const dataVehiculos = await resVehiculos.json()
      setVehiculos(dataVehiculos)

      const resClientes = await fetch('/api/clientes')
      const dataClientes = await resClientes.json()
      setClientes(dataClientes)
      
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

  const manejarBusqueda = (e) => {
    setBusquedaPatente(e.target.value)
    setPaginaActual(1)
  }

  const guardarVehiculo = async (e) => {
    e.preventDefault()
    try {
      const respuesta = await fetch('/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })
      if (respuesta.ok) {
        setFormulario({ patente: '', marca: '', modelo: '', anio: '', id_cliente: '' })
        cargarDatos()
      }
    } catch (error) {
      console.error('Error en POST:', error)
    }
  }

  const iniciarEdicion = (vehiculo) => {
    setEditandoId(vehiculo.id_vehiculo)
    setDatosEditados({
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      id_cliente: vehiculo.id_cliente
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
  }

  const guardarEdicion = async (id) => {
    try {
      const respuesta = await fetch(`/api/vehiculos/${id}`, {
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

  // Lógica de filtrado y paginación
  const vehiculosFiltrados = vehiculos.filter(vehiculo => 
    vehiculo.patente.toLowerCase().includes(busquedaPatente.toLowerCase())
  )
  const totalPaginas = Math.ceil(vehiculosFiltrados.length / vehiculosPorPagina)
  const indiceUltimo = paginaActual * vehiculosPorPagina
  const indicePrimer = indiceUltimo - vehiculosPorPagina
  const vehiculosPaginados = vehiculosFiltrados.slice(indicePrimer, indiceUltimo)

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina)

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px',
    border: '1px solid var(--border-color)', marginTop: '6px', fontSize: '14px',
    fontFamily: 'inherit', color: 'var(--text-main)', backgroundColor: 'transparent',
    boxSizing: 'border-box'
  }

  const editInputStyle = {
    ...inputStyle, padding: '4px 8px', marginTop: '0', border: '1px solid #2563eb'
  }

  return (
    <>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Gestión de parque automotriz y asignación de dueños</p>
      
      {/* Formulario Fijo */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--text-main)' }}>Registrar Nuevo Vehículo</h3>
        <form onSubmit={guardarVehiculo}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Patente</label><input type="text" name="patente" value={formulario.patente} onChange={manejarCambio} required placeholder="Ej: AB123CD" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Marca</label><input type="text" name="marca" value={formulario.marca} onChange={manejarCambio} required placeholder="Ej: Toyota" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Modelo</label><input type="text" name="modelo" value={formulario.modelo} onChange={manejarCambio} required placeholder="Ej: Yaris" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Año</label><input type="number" name="anio" value={formulario.anio} onChange={manejarCambio} required placeholder="Ej: 2020" style={inputStyle} /></div>
            
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Dueño (Cliente)</label>
              <select name="id_cliente" value={formulario.id_cliente} onChange={manejarCambio} required style={inputStyle}>
                <option value="">Seleccione un cliente...</option>
                {clientes.map(cliente => (
                  <option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {cliente.nombre} - {cliente.rut}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Guardar Vehículo</button>
        </form>
      </div>

      {/* Tabla Vehículos */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Registro de Vehículos</h3>
          <div style={{ width: '300px' }}>
            <input type="text" placeholder="Buscar por patente..." value={busquedaPatente} onChange={manejarBusqueda} style={{ ...inputStyle, marginTop: 0, borderColor: '#38bdf8' }} />
          </div>
        </div>
        
        {cargando ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando vehículos...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Patente</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Marca</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Modelo</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Año</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Dueño</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '160px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosPaginados.length > 0 ? (
                  vehiculosPaginados.map((vehiculo) => (
                    <tr key={vehiculo.id_vehiculo} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>
                        {editandoId === vehiculo.id_vehiculo ? <input type="text" name="patente" value={datosEditados.patente} onChange={manejarCambioEdicion} style={editInputStyle} /> : vehiculo.patente}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        {editandoId === vehiculo.id_vehiculo ? <input type="text" name="marca" value={datosEditados.marca} onChange={manejarCambioEdicion} style={editInputStyle} /> : vehiculo.marca}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        {editandoId === vehiculo.id_vehiculo ? <input type="text" name="modelo" value={datosEditados.modelo} onChange={manejarCambioEdicion} style={editInputStyle} /> : vehiculo.modelo}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        {editandoId === vehiculo.id_vehiculo ? <input type="number" name="anio" value={datosEditados.anio} onChange={manejarCambioEdicion} style={editInputStyle} /> : vehiculo.anio}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        {editandoId === vehiculo.id_vehiculo ? (
                          <select name="id_cliente" value={datosEditados.id_cliente} onChange={manejarCambioEdicion} style={editInputStyle}>
                            {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>)}
                          </select>
                        ) : vehiculo.nombre_cliente}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        {editandoId === vehiculo.id_vehiculo ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => guardarEdicion(vehiculo.id_vehiculo)} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Guardar</button>
                            <button onClick={cancelarEdicion} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => iniciarEdicion(vehiculo)} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                            Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron vehículos.</td></tr>
                )}
              </tbody>
            </table>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button key={num} onClick={() => cambiarPagina(num)} style={{ padding: '6px 12px', borderRadius: '6px', border: num === paginaActual ? 'none' : '1px solid var(--border-color)', backgroundColor: num === paginaActual ? '#2563eb' : 'transparent', color: num === paginaActual ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
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