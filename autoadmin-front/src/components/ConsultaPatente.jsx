import { useState } from 'react'

export default function ConsultaPatente() {
  const [patente, setPatente] = useState('')
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Estados exclusivos para la Inteligencia Artificial
  const [cargandoIA, setCargandoIA] = useState(false)
  const [recomendacionIA, setRecomendacionIA] = useState(null)

  const buscarPatente = async (e) => {
    e.preventDefault()
    if (!patente.trim()) return

    setCargando(true)
    setError('')
    setDatos(null)
    setRecomendacionIA(null)

    try {
      const respuesta = await fetch(`/api/consulta/${patente}`)
      
      if (respuesta.status === 404) {
        setError('No se encontraron registros para la patente ingresada.')
        setCargando(false)
        return
      }

      if (respuesta.ok) {
        const data = await respuesta.json()
        setDatos(data)
        
        // Simulación de la llamada a la API de Inteligencia Artificial
        setCargandoIA(true)
        setTimeout(() => {
          if (data.historial.length === 0) {
            setRecomendacionIA("✨ El vehículo no registra historial. Se recomienda ofrecer una Inspección General de 360° (frenos, niveles, escáner y correas) para establecer una línea base de mantenimiento preventivo.")
          } else {
            setRecomendacionIA("✨ Análisis completado: Basado en el último ingreso, se sugiere revisar el desgaste de pastillas de freno y ofrecer cambio de líquido refrigerante por antigüedad. Revise los soportes del motor si el cliente reporta vibraciones.")
          }
          setCargandoIA(false)
        }, 1500) // Simula 1.5 segundos de procesamiento de IA

      } else {
        setError('Error de conexión con la base de datos.')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error al comunicarse con el servidor.')
    }
    
    setCargando(false)
  }

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

  return (
    <>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 32px 0' }}>Buscador integrado de historial de vehículos y clientes</p>
      
      {/* Buscador Central */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', marginBottom: '32px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 24px 0', color: 'var(--text-main)' }}>Consulta Rápida por Patente</h2>
        
        <form onSubmit={buscarPatente} style={{ display: 'flex', justifyContent: 'center', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
          <input 
            type="text" 
            value={patente} 
            onChange={(e) => setPatente(e.target.value.toUpperCase())}
            placeholder="EJ: AB123CD" 
            required 
            style={{ 
              flex: 1, padding: '16px 24px', fontSize: '18px', borderRadius: '8px', border: '2px solid #cbd5e1', 
              textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold', outline: 'none', backgroundColor: 'transparent', color: 'var(--text-main)'
            }} 
          />
          <button type="submit" disabled={cargando} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0 32px', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: cargando ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && <p style={{ color: '#ef4444', fontWeight: '500', marginTop: '16px' }}>{error}</p>}
      </div>

      {/* Resultados de la Búsqueda */}
      {datos && datos.vehiculo && (
        <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
          
          {/* Tarjetas de Información */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Tarjeta Auto */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Datos del Vehículo</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '15px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Patente:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.patente}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Marca:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.marca}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Modelo:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.modelo}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Año:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.anio}</strong></div>
              </div>
            </div>

            {/* Tarjeta Cliente */}
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Propietario Registrado</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '15px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Nombre:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.nombre_cliente}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>RUT:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.rut}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Teléfono:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.telefono || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong style={{ color: 'var(--text-main)', display: 'block' }}>{datos.vehiculo.email || 'N/A'}</strong></div>
              </div>
            </div>
          </div>

          {/* Módulo de Inteligencia Artificial (Estructura Base) */}
          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            {/* Línea decorativa estilo IA */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' }}></div>
            
            <h3 style={{ margin: '0 0 12px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span> Asistente IA AutoAdmin
            </h3>

            {cargandoIA ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontStyle: 'italic' }}>
                <div className="spinner-ia"></div> Analizando historial del vehículo y generando recomendaciones...
              </div>
            ) : (
              <p style={{ margin: 0, color: '#334155', lineHeight: '1.6', fontSize: '15px', fontWeight: '500' }}>
                {recomendacionIA}
              </p>
            )}
          </div>

          {/* Historial de Órdenes */}
          <div style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-main)' }}>Historial de Reparaciones ({datos.historial.length})</h3>
            
            {datos.historial.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Este vehículo no registra ingresos previos al taller.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>N° Orden</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Fecha Ingreso</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600', width: '40%' }}>Detalle Falla</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Total Estimado</th>
                    <th style={{ padding: '0 8px 16px 8px', fontWeight: '600' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.historial.map((orden) => {
                    const colores = obtenerColorEstado(orden.estado)
                    const fecha = new Date(orden.fecha_ingreso).toLocaleDateString('es-CL')
                    
                    return (
                      <tr key={orden.id_orden} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-main)' }}>
                        <td style={{ padding: '16px 8px', fontWeight: 'bold' }}>#{orden.id_orden}</td>
                        <td style={{ padding: '16px 8px' }}>{fecha}</td>
                        <td style={{ padding: '16px 8px' }}>{orden.descripcion_falla}</td>
                        <td style={{ padding: '16px 8px', fontWeight: '500' }}>{formatearDinero(orden.total_estimado)}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ backgroundColor: colores.bg, color: colores.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{orden.estado}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      
      {/* Animaciones CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner-ia {
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e1;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  )
}