import { useState, useEffect } from 'react'

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [formulario, setFormulario] = useState({
    rut: '', nombre: '', telefono: '', email: '', direccion: ''
  })

  // Estados para la edición en línea
  const [editandoId, setEditandoId] = useState(null)
  const [datosEditados, setDatosEditados] = useState({
    rut: '', nombre: '', telefono: '', email: '', direccion: ''
  })

  // Nuevos estados para Búsqueda y Paginación
  const [busquedaRut, setBusquedaRut] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const clientesPorPagina = 20

  const cargarClientes = () => {
    fetch('/api/clientes')
      .then(respuesta => respuesta.json())
      .then(datos => {
        setClientes(datos)
        setCargando(false)
      })
      .catch(error => console.error('Error conectando al backend:', error))
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

  // Si el usuario busca algo, regresamos a la página 1 automáticamente
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
    (cliente.rut || '').toLowerCase().includes(busquedaRut.toLowerCase())
  )

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina)

  const indiceUltimoCliente = paginaActual * clientesPorPagina
  const indicePrimerCliente = indiceUltimoCliente - clientesPorPagina
  const clientesPaginados = clientesFiltrados.slice(indicePrimerCliente, indiceUltimoCliente)

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina)
  }

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
        
        {/* Cabecera con Buscador */}
        <div className="header-flex" style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Directorio de Clientes</h3>
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Buscar por RUT..." 
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
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '160px' }}>Acciones</th>
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
                            <button onClick={() => iniciarEdicion(cliente)} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
                              Editar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No se encontraron clientes con ese RUT.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación UI */}
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
    </>
  )
}