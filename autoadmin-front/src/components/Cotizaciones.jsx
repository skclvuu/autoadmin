import { useState, useEffect } from 'react'
import VehiculoSelect from './VehiculoSelect'

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [formulario, setFormulario] = useState({
    id_vehiculo: '',
    fecha: new Date().toISOString().split('T')[0],
    servicio: '',
    mano_obra: '',
    repuestos: '',
    otros: '',
    detalle: ''
  })
  
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 20

  const cargarDatos = async () => {
    try {
      const resCotizaciones = await fetch('/api/cotizaciones')
      const dataCoti = await resCotizaciones.json()
      setCotizaciones(dataCoti)

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

  const neto = (Number(formulario.mano_obra) || 0) + (Number(formulario.repuestos) || 0) + (Number(formulario.otros) || 0)
  const iva = Math.round(neto * 0.19)
  const totalEstimado = neto + iva

  const guardarCotizacion = async (e) => {
    e.preventDefault()
    const detalleCompleto = `${formulario.servicio.toUpperCase()} | MO: $${formulario.mano_obra} | Repuestos: $${formulario.repuestos} | Otros: $${formulario.otros} | Nota: ${formulario.detalle}`

    try {
      const respuesta = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_vehiculo: formulario.id_vehiculo,
          detalle: detalleCompleto,
          total: totalEstimado
        })
      })
      if (respuesta.ok) {
        setFormulario({ id_vehiculo: '', fecha: new Date().toISOString().split('T')[0], servicio: '', mano_obra: '', repuestos: '', otros: '', detalle: '' })
        cargarDatos()
      }
    } catch (error) {
      console.error('Error en POST:', error)
    }
  }

  // Guardado automático al cambiar el valor del select
  const cambiarEstadoRapido = async (coti, nuevoEstado) => {
    try {
      await fetch(`/api/cotizaciones/${coti.id_cotizacion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detalle: coti.detalle, total: coti.total, estado: nuevoEstado })
      })
      cargarDatos()
    } catch (error) {
      console.error('Error al actualizar estado:', error)
    }
  }

  const generarPDF = (coti) => {
    const netoCalc = Math.round(coti.total / 1.19);
    const ivaCalc = coti.total - netoCalc;
    const fechaFormat = new Date(coti.fecha_emision).toLocaleDateString('es-CL');

    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>Cotización #${coti.id_cotizacion}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .box { padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #f1f5f9; }
            .totales { width: 300px; float: right; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
            .totales div { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
            .total-final { background-color: #2563eb; color: white; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header"><h1>AutoAdmin</h1><p>Cotización Comercial</p></div>
          <div class="box">
            <strong>Cliente:</strong> ${coti.nombre_cliente} | <strong>Patente:</strong> ${coti.patente} | <strong>Fecha:</strong> ${fechaFormat}
          </div>
          <table>
            <thead><tr><th>Detalle del Servicio (Incluye desglose MO y Repuestos)</th></tr></thead>
            <tbody><tr><td>${coti.detalle}</td></tr></tbody>
          </table>
          <div class="totales">
            <div><span>Neto:</span> <span>$${netoCalc.toLocaleString('es-CL')}</span></div>
            <div><span>IVA (19%):</span> <span>$${ivaCalc.toLocaleString('es-CL')}</span></div>
            <div class="total-final"><span>TOTAL:</span> <span>$${Number(coti.total).toLocaleString('es-CL')}</span></div>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
    setTimeout(() => ventana.print(), 250);
  }

  const enviarPorCorreo = async (coti) => {
    const emailPrompt = window.prompt(`Ingrese correo para enviar cotización a ${coti.nombre_cliente}:`, "cliente@ejemplo.com");
    if (!emailPrompt) return;
    try {
      const res = await fetch(`/api/cotizaciones/${coti.id_cotizacion}/enviar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailPrompt, nombre_cliente: coti.nombre_cliente, detalle: coti.detalle, total: coti.total })
      });
      if (res.ok) alert('Cotización enviada exitosamente.');
    } catch (error) { alert('Error al enviar correo.'); }
  }

  const filtradas = cotizaciones.filter(coti => 
    coti.patente.toLowerCase().includes(busqueda.toLowerCase()) ||
    coti.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase())
  )
  const totalPaginas = Math.ceil(filtradas.length / registrosPorPagina)
  const paginadas = filtradas.slice((paginaActual - 1) * registrosPorPagina, paginaActual * registrosPorPagina)

  const formatearDinero = (monto) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(monto)

  const obtenerColorEstado = (estado) => {
    switch(estado) {
      case 'Emitida': return { bg: '#ffedd5', text: '#c2410c' } 
      case 'Aprobada': return { bg: '#dbeafe', text: '#1d4ed8' }
      case 'Rechazada': return { bg: '#fee2e2', text: '#b91c1c' }
      default: return { bg: '#f1f5f9', text: '#475569' }
    }
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '6px', fontSize: '14px', fontFamily: 'inherit', color: '#1c2434', boxSizing: 'border-box' }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <p style={{ color: '#64748b', margin: 0 }}>Creación de cotizaciones para servicios y reparaciones del taller</p>
        <input type="text" placeholder="Buscar patente o cliente..." value={busqueda} onChange={(e) => {setBusqueda(e.target.value); setPaginaActual(1)}} style={{ ...inputStyle, width: '250px', marginTop: 0 }} />
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Nueva cotización</h3>
        
        <form onSubmit={guardarCotizacion}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Vehículo (Cliente)</label>
              <VehiculoSelect
                name="id_vehiculo"
                vehiculos={vehiculos}
                value={formulario.id_vehiculo}
                onChange={manejarCambio}
                required
                style={inputStyle}
                placeholder="Seleccione un vehículo..."
                formato={(v) => `${v.patente} - ${v.nombre_cliente}`}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Fecha de cotización</label>
              <input type="date" name="fecha" value={formulario.fecha} onChange={manejarCambio} style={inputStyle} />
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Servicio principal</label>
              <input type="text" name="servicio" value={formulario.servicio} onChange={manejarCambio} placeholder="Ej: Cambio de frenos" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Mano de obra (Neto)</label>
              <input type="number" name="mano_obra" value={formulario.mano_obra} onChange={manejarCambio} placeholder="Ej: 25000" style={inputStyle} />
            </div>
            
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Costo de repuestos (Neto)</label>
              <input type="number" name="repuestos" value={formulario.repuestos} onChange={manejarCambio} placeholder="Ej: 35000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500' }}>Otros costos (Neto)</label>
              <input type="number" name="otros" value={formulario.otros} onChange={manejarCambio} placeholder="Ej: 8000" style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>Detalle adicional de la cotización</label>
            <textarea name="detalle" value={formulario.detalle} onChange={manejarCambio} rows="4" placeholder="Ej: Se considera cambio de pastillas delanteras..." style={{...inputStyle, resize: 'vertical'}}></textarea>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#64748b' }}>Total estimado (IVA Incluido)</h4>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}>${totalEstimado.toLocaleString('es-CL')}</p>
            </div>
            {totalEstimado > 0 && (
              <div style={{ textAlign: 'right', color: '#64748b', fontSize: '14px' }}>
                <div>Neto: ${neto.toLocaleString('es-CL')}</div>
                <div>IVA: ${iva.toLocaleString('es-CL')}</div>
              </div>
            )}
          </div>

          <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Guardar cotización</button>
        </form>
      </div>

      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 24px 0', fontSize: '18px' }}>Cotizaciones registradas</h3>
        
        {cargando ? (
          <p style={{ color: '#64748b' }}>Cargando cotizaciones...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Nº</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Patente</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Cliente</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '30%' }}>Detalle</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '120px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginadas.length > 0 ? paginadas.map((coti) => {
                  const colores = obtenerColorEstado(coti.estado)
                  return (
                    <tr key={coti.id_cotizacion} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' }}>
                      <td style={{ padding: '16px 8px', fontWeight: '500' }}>#{coti.id_cotizacion}</td>
                      <td style={{ padding: '16px 8px', fontWeight: '600' }}>{coti.patente}</td>
                      <td style={{ padding: '16px 8px' }}>{coti.nombre_cliente}</td>
                      <td style={{ padding: '16px 8px' }}>{coti.detalle}</td>
                      <td style={{ padding: '16px 8px', fontWeight: '600' }}>{formatearDinero(coti.total)}</td>
                      
                      {/* SELECT CAMUFLADO (Se cambia con 1 solo clic) */}
                      <td style={{ padding: '16px 8px' }}>
                        <select 
                          value={coti.estado}
                          onChange={(e) => cambiarEstadoRapido(coti, e.target.value)}
                          title="Haz clic para cambiar estado"
                          style={{ 
                            backgroundColor: colores.bg, 
                            color: colores.text, 
                            padding: '4px 8px', 
                            borderRadius: '20px', 
                            border: 'none',
                            fontSize: '12px', 
                            fontWeight: '700', 
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Emitida">Emitida</option>
                          <option value="Aprobada">Aprobada</option>
                          <option value="Rechazada">Rechazada</option>
                        </select>
                      </td>
                      
                      {/* BOTONES PEQUEÑOS Y SIN EMOJIS */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => generarPDF(coti)} title="Generar PDF" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                            PDF
                          </button>
                          <button onClick={() => enviarPorCorreo(coti)} title="Enviar por correo" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
                            Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No se encontraron cotizaciones.</td></tr>}
              </tbody>
            </table>
            
            {totalPaginas > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                  <button key={num} onClick={() => setPaginaActual(num)} style={{ padding: '6px 12px', borderRadius: '6px', border: num === paginaActual ? 'none' : '1px solid #cbd5e1', backgroundColor: num === paginaActual ? '#2563eb' : 'white', color: num === paginaActual ? 'white' : '#1e293b', cursor: 'pointer', fontWeight: '500' }}>
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