import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Car, Wrench, FileText, Search, LogOut, Package } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Clientes from './components/Clientes'
import Vehiculos from './components/Vehiculos'
import OrdenesTrabajo from './components/OrdenesTrabajo'
import Cotizaciones from './components/Cotizaciones'
import ConsultaPatente from './components/ConsultaPatente'
import Inventario from './components/Inventario'

function App() {
  // 1. Estado inicial: Lee la memoria del navegador. Si no hay nada, usa 'Panel principal'
  const [vistaActual, setVistaActual] = useState(() => {
    return localStorage.getItem('vistaAutoAdmin') || 'Panel principal'
  })

  // 2. Efecto: Cada vez que 'vistaActual' cambia, se guarda en el LocalStorage
  useEffect(() => {
    localStorage.setItem('vistaAutoAdmin', vistaActual)
  }, [vistaActual])

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: 'var(--bg-main)', textAlign: 'left', transition: 'background-color 0.3s' }}>
      
      {/* Menú Lateral */}
      <aside style={{ width: '260px', backgroundColor: 'var(--bg-sidebar)', color: 'white', padding: '24px', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s' }}>
        
        {/* Branding AutoAdmin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={24} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>AutoAdmin</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Gestión de Taller</span>
          </div>
        </div>

        {/* Lista de Navegación */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {menuItems.map((item) => (
            <li key={item.nombre} style={{ marginBottom: '8px' }}>
              <button 
                onClick={() => setVistaActual(item.nombre)}
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

          {/* Separador visual antes de los ajustes */}
          <div style={{ height: '1px', backgroundColor: '#334155', margin: '20px 0', marginTop: 'auto' }}></div>

          {/* Botón Cerrar sesión */}
          <li>
            <button 
              onClick={() => setVistaActual('Cerrar sesión')}
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
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', color: 'var(--text-main)', transition: 'color 0.3s' }}>
        
        {vistaActual === 'Panel principal' && <Dashboard setVistaActual={setVistaActual} />}
        {vistaActual === 'Clientes' && <Clientes />}
        {vistaActual === 'Vehículos' && <Vehiculos />}
        {vistaActual === 'Órdenes de trabajo' && <OrdenesTrabajo />}
        {vistaActual === 'Cotizaciones' && <Cotizaciones />}
        {vistaActual === 'Consulta por patente' && <ConsultaPatente />}
        {vistaActual === 'Inventario' && <Inventario />}

        {vistaActual === 'Cerrar sesión' && (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <LogOut size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '24px' }}>Cerrando sesión de AutoAdmin...</h2>
          </div>
        )}
      </main>
    </div>
  )
}

export default App