import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Car, Wrench, FileText, Search, LogOut, Package, Menu, X, AlertTriangle } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Clientes from './components/Clientes'
import Vehiculos from './components/Vehiculos'
import OrdenesTrabajo from './components/OrdenesTrabajo'
import Cotizaciones from './components/Cotizaciones'
import ConsultaPatente from './components/ConsultaPatente'
import Inventario from './components/Inventario'
import Login from './components/Login'

function App() {
  // 1. Estado de sesión: Lee el usuario guardado en el navegador
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // 2. Estado de vista: Lee la última vista activa o usa 'Panel principal'
  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('vistaAutoAdmin') || 'Panel principal'
  })

  // Estado del menú móvil
  const [menuAbierto, setMenuAbierto] = useState(false)

  // Estados para la alerta flotante de inventario
  const [stockCriticoAlerta, setStockCriticoAlerta] = useState([])
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(false)

  // 3. Efecto: Guarda 'vistaActual' en LocalStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('vistaAutoAdmin', vistaActual)
  }, [vistaActual])

  // 4. Efecto: Sincroniza el botón "Atrás" del navegador con las vistas
  useEffect(() => {
    if (!user) return

    window.history.replaceState({ vista: vistaActual }, '')

    const manejarRetroceso = (event) => {
      if (event.state?.vista) {
        setVistaActual(event.state.vista)
        setMenuAbierto(false)
      }
    }

    window.addEventListener('popstate', manejarRetroceso)
    return () => window.removeEventListener('popstate', manejarRetroceso)
  }, [user])

  // 5. Efecto: Verifica stock crítico una vez por sesión al iniciar
  useEffect(() => {
    if (!user) return
    if (sessionStorage.getItem('alertaStockVista') === 'true') return

    const verificarStockCritico = async () => {
      try {
        const res = await fetch('/api/inventario')
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data)) return

        const criticos = data.filter(item => Number(item.stock) <= Number(item.min))
        if (criticos.length > 0) {
          setStockCriticoAlerta(criticos)
          setMostrarAlertaStock(true)
          sessionStorage.setItem('alertaStockVista', 'true')
        }
      } catch (error) {
        console.error('Error verificando stock crítico:', error)
      }
    }

    verificarStockCritico()
  }, [user])

  // 6. Función para cerrar sesión y limpiar LocalStorage / SessionStorage
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('vistaAutoAdmin')
    sessionStorage.removeItem('alertaStockVista')
    setMostrarAlertaStock(false)
    setVistaActual('Panel principal')
    setMenuAbierto(false)
    setUser(null)
  }

  const seleccionarVista = (nombre) => {
    if (nombre !== vistaActual) {
      window.history.pushState({ vista: nombre }, '')
      setVistaActual(nombre)
    }
    setMenuAbierto(false)
  }

  // Si no hay sesión activa, mostrar únicamente la pantalla de Login
  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  // Vinculamos cada vista con su ícono profesional de Lucide
  const menuItems = [
    { nombre: 'Panel principal', icono: <LayoutDashboard size={20} /> },
    { nombre: 'Clientes', icono: <Users size={20} /> },
    { nombre: 'Vehículos', icono: <Car size={20} /> },
    { nombre: 'Órdenes de trabajo', icono: <Wrench size={20} /> },
    { nombre: 'Inventario', icono: <Package size={20} /> },
    { nombre: 'Cotizaciones', icono: <FileText size={20} /> },
    { nombre: 'Consulta por patente', icono: <Search size={20} /> }
  ]

  return (
    <div className="app-layout">
      
      {/* Barra superior solo visible en celular */}
      <header className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '4px' }}
          >
            <Menu size={24} />
          </button>
          <span style={{ fontWeight: '600', fontSize: '16px' }}>{vistaActual}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ backgroundColor: '#2563eb', padding: '5px', borderRadius: '6px', display: 'flex' }}>
            <Wrench size={16} color="white" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '15px' }}>AutoAdmin</span>
        </div>
      </header>

      {/* Fondo oscuro al abrir el menú en celular */}
      {menuAbierto && (
        <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      {/* Menú Lateral */}
      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        
        {/* Branding AutoAdmin */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wrench size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>AutoAdmin</h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Gestión de Taller</span>
            </div>
          </div>

          <button
            className="sidebar-close-btn"
            onClick={() => setMenuAbierto(false)}
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        {/* Lista de Navegación */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          {menuItems.map((item) => (
            <li key={item.nombre} style={{ marginBottom: '8px' }}>
              <button 
                onClick={() => seleccionarVista(item.nombre)}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  backgroundColor: vistaActual === item.nombre ? 'var(--hover-sidebar)' : 'transparent',
                  color: vistaActual === item.nombre ? '#ffffff' : '#94a3b8',
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '15px', 
                  fontWeight: vistaActual === item.nombre ? '500' : '400',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.icono}
                <span>{item.nombre}</span>
              </button>
            </li>
          ))}

          {/* Separador visual antes del usuario y cerrar sesión */}
          <div style={{ height: '1px', backgroundColor: '#334155', margin: '20px 0', marginTop: 'auto' }}></div>

          {/* Info del usuario logueado */}
          <li style={{ padding: '0 16px 12px', fontSize: '13px', color: '#94a3b8' }}>
            <div style={{ color: '#f8fafc', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </div>
            <div>{user.rol}</div>
          </li>

          {/* Botón Cerrar sesión */}
          <li>
            <button 
              onClick={handleLogout}
              style={{ 
                width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                backgroundColor: 'transparent', color: '#ef4444', border: 'none', borderRadius: '8px', 
                cursor: 'pointer', fontSize: '15px', fontWeight: '500' 
              }}
            >
              <LogOut size={20} />
              <span>Cerrar sesión</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* Área principal */}
      <main className="main-content">
        {vistaActual === 'Panel principal' && <Dashboard setVistaActual={seleccionarVista} />}
        {vistaActual === 'Clientes' && <Clientes />}
        {vistaActual === 'Vehículos' && <Vehiculos />}
        {vistaActual === 'Órdenes de trabajo' && <OrdenesTrabajo />}
        {vistaActual === 'Cotizaciones' && <Cotizaciones />}
        {vistaActual === 'Consulta por patente' && <ConsultaPatente />}
        {vistaActual === 'Inventario' && <Inventario />}
      </main>

      {/* Notificación Flotante (Toast) de Stock Crítico */}
      {mostrarAlertaStock && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: 'calc(100% - 32px)',
            maxWidth: '370px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid #fecaca',
            borderLeft: '4px solid #dc2626',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
            zIndex: 1100
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={18} />
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>
                  Stock crítico detectado
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {stockCriticoAlerta.length} {stockCriticoAlerta.length === 1 ? 'repuesto bajo' : 'repuestos bajo'} el mínimo
                </div>
              </div>
            </div>

            <button
              onClick={() => setMostrarAlertaStock(false)}
              aria-label="Cerrar alerta"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex'
              }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {stockCriticoAlerta.slice(0, 3).map((item, idx) => (
              <div
                key={item.id_repuesto || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b'
                }}
              >
                <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                  {item.nombre}
                </span>
                <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>
                  {item.stock} / {item.min}
                </span>
              </div>
            ))}
            {stockCriticoAlerta.length > 3 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                +{stockCriticoAlerta.length - 3} repuestos más
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              onClick={() => setMostrarAlertaStock(false)}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                setMostrarAlertaStock(false)
                seleccionarVista('Inventario')
              }}
              style={{
                backgroundColor: '#dc2626',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Ver inventario
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App