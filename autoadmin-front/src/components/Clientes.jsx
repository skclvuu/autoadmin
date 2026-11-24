import { useState, useEffect } from 'react'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [clienteDetalle, setClienteDetalle] = useState(null)

  const [formulario, setFormulario] = useState({
    rut: '', nombre: '', telefono: '', email: '', direccion: ''
  })

  // Estados para la edición en línea
  const [editandoId, setEditandoId] = useState(null)
  const [datosEditados, setDatosEditados] = useState({
    rut: '', nombre: '', telefono: '', email: '', direccion: ''
  })

  // Estados para Búsqueda y Paginación
  const [busquedaRut, setBusquedaRut] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const clientesPorPagina = 20

  const cargarClientes = async () => {
    try {
      const [resClientes, resVehiculos] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/vehiculos')
      ])
      const dataClientes = resClientes.ok ? await resClientes.json() : []
      const dataVehiculos = resVehiculos.ok ? await resVehiculos.json() : []

      setClientes(Array.isArray(dataClientes) ? dataClientes : [])
      setVehiculos(Array.isArray(dataVehiculos) ? dataVehiculos : [])
    } catch (error) {
      console.error('Error conectando al backend:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const manejarCambioEdicion = (e) => {
    setDatosEditados({ ...datosEditados, [e.target.name]: e.target.value })
  }

  const manejarBusqueda = (e) => {
    setBusquedaRut(e.target.value)
    setPaginaActual(1)
  }

  const guardarCliente = async (e) => {
    e.preventDefault()
    try {
      const respuesta = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })
      if (respuesta.ok) {
        setFormulario({ rut: '', nombre: '', telefono: '', email: '', direccion: '' })
        cargarClientes()
      }
    } catch (error) {
      console.error('Error en POST:', error)
    }
  }

  const iniciarEdicion = (cliente) => {
    setEditandoId(cliente.id_cliente)
    setDatosEditados({
      rut: cliente.rut,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
  }

  const guardarEdicion = async (id) => {
    try {
      const respuesta = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados)
      })
      if (respuesta.ok) {
        setEditandoId(null)
        cargarClientes()
      }
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const clientesFiltrados = clientes.filter(cliente =>
    (cliente.rut || '').toLowerCase().includes(busquedaRut.toLowerCase()) ||
    (cliente.nombre || '').toLowerCase().includes(busquedaRut.toLowerCase())
  )

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina)
  const indiceUltimoCliente = paginaActual * clientesPorPagina
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina
  const clientesPaginados = clientesFiltrados.slice(indicePrimerCliente, indiceUltimoCliente)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

  const vehiculosDelCliente = clienteDetalle
    ? vehiculos.filter(v => String(v.id_cliente) === String(clienteDetalle.id_cliente))
    : []

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px',
    border: '1px solid var(--border-color)', marginTop: '6px', fontSize: '14px',
    fontFamily: 'inherit', color: 'var(--text-main)', backgroundColor: 'transparent',
    boxSizing: 'border-box'
  }

  const editInputStyle = {
    width: '100%', padding: '4px 8px', borderRadius: '4px',
    border: '1px solid #2563eb', fontSize: '14px',
    fontFamily: 'inherit', color: 'var(--text-main)', backgroundColor: 'transparent',
    boxSizing: 'border-box'
  }

  return (
    <>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Administración del directorio de clientes del taller</p>

      {/* Formulario Fijo */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--text-main)' }}>Registrar Nuevo Cliente</h3>
        <form onSubmit={guardarCliente}>
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>RUT</label>
              <input type="text" name="rut" value={formulario.rut} onChange={manejarCambio} required placeholder="Ej: 12345678-9" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Nombre Completo</label>
              <input type="text" name="nombre" value={formulario.nombre} onChange={manejarCambio} required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Teléfono</label>
              <input type="text" name="telefono" value={formulario.telefono} onChange={manejarCambio} placeholder="Ej: +569..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Email</label>
              <input type="email" name="email" value={formulario.email} onChange={manejarCambio} placeholder="correo@ejemplo.com" style={inputStyle} />
            </div>
            <div className="span-2">
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Dirección</label>
              <input type="text" name="direccion" value={formulario.direccion} onChange={manejarCambio} placeholder="Calle y comuna" style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Guardar Cliente</button>
        </form>
      </div>

      {/* Tabla Clientes con Buscador */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>

        <div className="header-flex" style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Directorio de Clientes</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por RUT o nombre..."
              value={busquedaRut}
              onChange={manejarBusqueda}
              style={{ ...inputStyle, marginTop: 0, borderColor: '#38bdf8' }}
            />
          </div>
        </div>

        {cargando ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando clientes...</p>
        ) : (
          <>
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>RUT</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Nombre</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Teléfono</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Email</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Dirección</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '190px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesPaginados.length > 0 ? (
                    clientesPaginados.map((cliente) => (
                      <tr key={cliente.id_cliente} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-main)' }}>
                        <td style={{ padding: '16px 8px', fontWeight: '500' }}>
                          {editandoId === cliente.id_cliente ? <input type="text" name="rut" value={datosEditados.rut} onChange={manejarCambioEdicion} style={editInputStyle} /> : cliente.rut}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === cliente.id_cliente ? <input type="text" name="nombre" value={datosEditados.nombre} onChange={manejarCambioEdicion} style={editInputStyle} /> : cliente.nombre}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === cliente.id_cliente ? <input type="text" name="telefono" value={datosEditados.telefono} onChange={manejarCambioEdicion} style={editInputStyle} /> : cliente.telefono}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === cliente.id_cliente ? <input type="email" name="email" value={datosEditados.email} onChange={manejarCambioEdicion} style={editInputStyle} /> : cliente.email}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === cliente.id_cliente ? <input type="text" name="direccion" value={datosEditados.direccion} onChange={manejarCambioEdicion} style={editInputStyle} /> : cliente.direccion}
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {editandoId === cliente.id_cliente ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => guardarEdicion(cliente.id_cliente)} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Guardar</button>
                              <button onClick={cancelarEdicion} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cancelar</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setClienteDetalle(cliente)}
                                style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                Detalles
                              </button>
                              <button
                                onClick={() => iniciarEdicion(cliente)}
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                Editar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No se encontraron clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {Array.from({ length: totalPaginas }, (_, index) => index + 1).map(numero => (
                  <button
                    key={numero}
                    onClick={() => cambiarPagina(numero)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: numero === paginaActual ? 'none' : '1px solid var(--border-color)',
                      backgroundColor: numero === paginaActual ? '#2563eb' : 'transparent',
                      color: numero === paginaActual ? 'white' : 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    {numero}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalles del Cliente */}
      {clienteDetalle && (
        <div
          onClick={() => setClienteDetalle(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 1000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '19px', color: 'var(--text-main)' }}>{clienteDetalle.nombre}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>RUT: {clienteDetalle.rut}</p>
              </div>
              <button
                onClick={() => setClienteDetalle(null)}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Cerrar
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px', fontSize: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Teléfono</div>
                <div style={{ color: 'var(--text-main)', marginTop: '4px' }}>{clienteDetalle.telefono || 'No registrado'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Email</div>
                <div style={{ color: 'var(--text-main)', marginTop: '4px' }}>{clienteDetalle.email || 'No registrado'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Dirección</div>
                <div style={{ color: 'var(--text-main)', marginTop: '4px' }}>{clienteDetalle.direccion || 'No registrada'}</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-main)' }}>Vehículos vinculados</h4>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 10px', borderRadius: '999px' }}>
                  {vehiculosDelCliente.length} {vehiculosDelCliente.length === 1 ? 'vehículo' : 'vehículos'}
                </span>
              </div>

              {vehiculosDelCliente.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {vehiculosDelCliente.map((v) => (
                    <div
                      key={v.id_vehiculo}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'rgba(148, 163, 184, 0.06)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#2563eb' }}>{v.patente}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>{v.marca} {v.modelo}</div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                        Año {v.anio}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                  Este cliente aún no tiene vehículos registrados.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}