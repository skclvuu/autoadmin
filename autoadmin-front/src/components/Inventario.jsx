import { useState, useEffect } from 'react'

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState({
    sku: '', nombre: '', cat: '', stock: '', min: '', ubi: ''
  })

  const [editandoSku, setEditandoSku] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [minEditado, setMinEditado] = useState('')
  const [ubiEditada, setUbiEditada] = useState('')

  const cargarInventario = () => {
    fetch('/api/inventario')
      .then(respuesta => respuesta.json())
      .then(datos => {
        setInventario(datos)
        setCargando(false)
      })
      .catch(error => console.error('Error conectando al backend:', error))
  }

  useEffect(() => {
    cargarInventario()
  }, [])

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value })
  }

  const guardarRepuesto = async (e) => {
    e.preventDefault()
    try {
      const respuesta = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulario)
      })
      if (respuesta.ok) {
        setFormulario({ sku: '', nombre: '', cat: '', stock: '', min: '', ubi: '' })
        cargarInventario()
        setMostrarFormulario(false)
      }
    } catch (error) {
      console.error('Error en POST:', error)
    }
  }

  // Actualización rápida de stock sin necesidad de abrir "Editar"
  const actualizarStockRapido = async (item, nuevoStock) => {
    const stockFinal = Math.max(0, Number(nuevoStock) || 0)

    // Actualización inmediata en pantalla
    setInventario(prev =>
      prev.map(i => {
        if (i.sku !== item.sku) return i
        const esCritico = stockFinal <= i.min
        return {
          ...i,
          stock: stockFinal,
          estado: esCritico ? 'CRÍTICO' : 'OK',
          bg: esCritico ? '#fee2e2' : '#dcfce3',
          text: esCritico ? '#b91c1c' : '#15803d'
        }
      })
    )

    try {
      await fetch(`/api/inventario/${item.sku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: item.nombre,
          stock_actual: stockFinal,
          stock_minimo: item.min,
          ubicacion: item.ubi || item.ubicacion || 'Bodega General'
        })
      })
    } catch (error) {
      console.error('Error al actualizar stock:', error)
      cargarInventario()
    }
  }

  const manejarCambioInputStock = (sku, valor) => {
    setInventario(prev =>
      prev.map(i => (i.sku === sku ? { ...i, stock: valor } : i))
    )
  }

  const iniciarEdicion = (item) => {
    setEditandoSku(item.sku)
    setNombreEditado(item.nombre)
    setMinEditado(item.min)
    setUbiEditada(item.ubi || item.ubicacion || '')
  }

  const cancelarEdicion = () => {
    setEditandoSku(null)
  }

  const guardarEdicion = async (item) => {
    try {
      const respuesta = await fetch(`/api/inventario/${item.sku}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: nombreEditado, 
          stock_actual: Number(item.stock) || 0, 
          stock_minimo: minEditado,
          ubicacion: ubiEditada
        })
      })
      if (respuesta.ok) {
        setEditandoSku(null)
        cargarInventario()
      }
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  const borrarRepuesto = async (sku) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el repuesto ${sku}?`)) return;
    
    try {
      const respuesta = await fetch(`/api/inventario/${sku}`, {
        method: 'DELETE'
      })
      if (respuesta.ok) {
        cargarInventario()
      }
    } catch (error) {
      console.error('Error al borrar:', error)
    }
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
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Control de existencias y alertas de reposición</p>
      
      {/* Formulario Plegable */}
      <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', marginBottom: '32px', transition: 'background-color 0.3s', overflow: 'hidden' }}>
        <button onClick={() => setMostrarFormulario(!mostrarFormulario)} style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Ingresar Nuevo Repuesto</h3>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)', transition: 'transform 0.4s ease', transform: mostrarFormulario ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        </button>

        <div style={{ maxHeight: mostrarFormulario ? '1000px' : '0', opacity: mostrarFormulario ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease-in-out, opacity 0.4s ease-in-out' }}>
          <form onSubmit={guardarRepuesto} style={{ padding: '0 24px 24px 24px', borderTop: '1px solid var(--border-color)' }}>
            <div className="grid-3" style={{ marginBottom: '24px', marginTop: '16px' }}>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>SKU / Código</label><input type="text" name="sku" value={formulario.sku} onChange={manejarCambio} required style={inputStyle} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Nombre</label><input type="text" name="nombre" value={formulario.nombre} onChange={manejarCambio} required style={inputStyle} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Categoría</label><input type="text" name="cat" value={formulario.cat} onChange={manejarCambio} required style={inputStyle} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Stock Inicial</label><input type="number" name="stock" value={formulario.stock} onChange={manejarCambio} required style={inputStyle} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Stock Mínimo</label><input type="number" name="min" value={formulario.min} onChange={manejarCambio} required style={inputStyle} /></div>
              <div><label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Ubicación</label><input type="text" name="ubi" value={formulario.ubi} onChange={manejarCambio} required style={inputStyle} /></div>
            </div>
            <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Guardar Repuesto</button>
          </form>
        </div>
      </div>

      {/* Tabla Stock */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', transition: 'background-color 0.3s' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: 'var(--text-main)' }}>Stock Actual en Bodega</h3>
        
        {cargando ? (
          <p style={{ color: 'var(--text-muted)' }}>Cargando inventario...</p>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>SKU</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '22%' }}>Repuesto</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Ubicación</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Stock</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '10%' }}>Mínimo</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '220px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {inventario.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-main)' }}>
                    <td style={{ padding: '16px 8px', fontWeight: '500' }}>{item.sku}</td>
                    
                    <td style={{ padding: '16px 8px' }}>
                      {editandoSku === item.sku ? (
                        <input type="text" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} style={editInputStyle} />
                      ) : item.nombre}
                    </td>

                    <td style={{ padding: '16px 8px' }}>
                      {editandoSku === item.sku ? (
                        <input type="text" value={ubiEditada} onChange={(e) => setUbiEditada(e.target.value)} style={editInputStyle} />
                      ) : (item.ubi || item.ubicacion || '-')}
                    </td>

                    {/* STOCK SIEMPRE EDITABLE */}
                    <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => actualizarStockRapido(item, Number(item.stock) - 1)}
                          style={{ padding: '2px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={item.stock}
                          onChange={(e) => manejarCambioInputStock(item.sku, e.target.value)}
                          onBlur={(e) => actualizarStockRapido(item, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur()
                            }
                          }}
                          style={{ width: '50px', textAlign: 'center', padding: '4px 2px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-main)', fontWeight: 'bold' }}
                        />
                        <button
                          type="button"
                          onClick={() => actualizarStockRapido(item, Number(item.stock) + 1)}
                          style={{ padding: '2px 8px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          +
                        </button>
                      </div>
                    </td>

                    <td style={{ padding: '16px 8px' }}>
                      {editandoSku === item.sku ? (
                        <input type="number" value={minEditado} onChange={(e) => setMinEditado(e.target.value)} style={editInputStyle} />
                      ) : item.min}
                    </td>

                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ backgroundColor: item.bg, color: item.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>{item.estado}</span>
                    </td>
                    
                    <td style={{ padding: '16px 8px' }}>
                      {editandoSku === item.sku ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => guardarEdicion(item)} style={{ padding: '6px 10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Guardar</button>
                          <button onClick={cancelarEdicion} style={{ padding: '6px 10px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Cancelar</button>
                          <button onClick={() => borrarRepuesto(item.sku)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Borrar</button>
                        </div>
                      ) : (
                        <button onClick={() => iniciarEdicion(item)} style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', transition: 'all 0.2s' }}>
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}