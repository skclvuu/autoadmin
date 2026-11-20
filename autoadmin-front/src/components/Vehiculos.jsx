import { useState, useEffect, useRef } from 'react'

function SelectorCliente({ clientes, value, onChange, placeholder = 'Seleccione un cliente...', compacto = false }) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const contenedorRef = useRef(null)

  const formatear = (c) => `${c.nombre} - ${c.rut}`

  // Sincroniza el texto mostrado cuando cambia el value externo (ej: al limpiar formulario o iniciar edición)
  useEffect(() => {
    const encontrado = clientes.find((c) => String(c.id_cliente) === String(value))
    setBusqueda(encontrado ? formatear(encontrado) : '')
  }, [value, clientes])

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const manejarClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false)
        const encontrado = clientes.find((c) => String(c.id_cliente) === String(value))
        setBusqueda(encontrado ? formatear(encontrado) : '')
      }
    }
    document.addEventListener('mousedown', manejarClickFuera)
    return () => document.removeEventListener('mousedown', manejarClickFuera)
  }, [value, clientes])

  const filtrados = clientes.filter((c) => {
    const texto = formatear(c).toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  const seleccionar = (cliente) => {
    setBusqueda(formatear(cliente))
    onChange(cliente.id_cliente)
    setAbierto(false)
  }

  return (
    <div ref={contenedorRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={busqueda}
          placeholder={placeholder}
          onFocus={() => {
            setAbierto(true)
            setBusqueda('')
          }}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setAbierto(true)
            if (e.target.value === '') onChange('')
          }}
          style={{
            width: '100%',
            padding: compacto ? '5px 28px 5px 8px' : '10px 32px 10px 12px',
            borderRadius: compacto ? '4px' : '6px',
            border: abierto
              ? '1.5px solid #0f172a'
              : compacto
                ? '1px solid #2563eb'
                : '1px solid var(--border-color)',
            marginTop: compacto ? '0' : '6px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-main)',
            backgroundColor: 'var(--bg-card)',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        <span
          onClick={() => setAbierto((prev) => !prev)}
          style={{
            position: 'absolute',
            right: '10px',
            top: compacto ? '50%' : 'calc(50% + 3px)',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            color: '#64748b',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {abierto ? '▲' : '▼'}
        </span>
      </div>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 50
          }}
        >
          {filtrados.length > 0 ? (
            filtrados.map((c) => {
              const seleccionado = String(c.id_cliente) === String(value)
              return (
                <div
                  key={c.id_cliente}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    seleccionar(c)
                  }}
                  style={{
                    padding: '10px 14px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    backgroundColor: seleccionado ? '#eff6ff' : 'transparent',
                    fontWeight: seleccionado ? '600' : '400',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    if (!seleccionado) e.currentTarget.style.backgroundColor = '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    if (!seleccionado) e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {formatear(c)}
                </div>
              )
            })
          ) : (
            <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              No se encontraron clientes
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
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
    if (!formulario.id_cliente) {
      alert('Por favor, selecciona un cliente de la lista.')
      return
    }

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
    if (!datosEditados.id_cliente) {
      alert('Por favor, selecciona un cliente de la lista.')
      return
    }

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
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Patente</label><input type="text" name="patente" value={formulario.patente} onChange={manejarCambio} required placeholder="Ej: AB123CD" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Marca</label><input type="text" name="marca" value={formulario.marca} onChange={manejarCambio} required placeholder="Ej: Toyota" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Modelo</label><input type="text" name="modelo" value={formulario.modelo} onChange={manejarCambio} required placeholder="Ej: Yaris" style={inputStyle} /></div>
            <div><label style={{ fontSize: '14px', fontWeight: '500' }}>Año</label><input type="number" name="anio" value={formulario.anio} onChange={manejarCambio} required placeholder="Ej: 2020" style={inputStyle} /></div>

            <div className="span-2">
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Dueño (Cliente)</label>
              <SelectorCliente
                clientes={clientes}
                value={formulario.id_cliente}
                onChange={(id) => setFormulario({ ...formulario, id_cliente: id })}
                placeholder="Seleccione cliente..."
              />
            </div>
          </div>
          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Guardar Vehículo</button>
        </form>
      </div>

      {/* Tabla Vehículos */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>

        <div className="header-flex" style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-main)' }}>Registro de Vehículos</h3>
          <div className="search-box">
            <input type="text" placeholder="Buscar por patente..." value={busquedaPatente} onChange={manejarBusqueda} style={{ ...inputStyle, marginTop: 0, borderColor: '#38bdf8' }} />
          </div>
        </div>

        {cargando ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando vehículos...</p>
        ) : (
          <>
            <div className="table-responsive" style={{ overflow: 'visible' }}>
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
                        <td style={{ padding: '16px 8px', minWidth: '220px' }}>
                          {editandoId === vehiculo.id_vehiculo ? (
                            <SelectorCliente
                              clientes={clientes}
                              value={datosEditados.id_cliente}
                              onChange={(id) => setDatosEditados({ ...datosEditados, id_cliente: id })}
                              placeholder="Buscar cliente..."
                              compacto
                            />
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
            </div>

            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
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