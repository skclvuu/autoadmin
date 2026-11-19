import { useState } from 'react';
import { Wrench, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

// Puedes reemplazar esta URL por una imagen local en tu carpeta public (ej: '/taller.jpg')
const WORKSHOP_BG =
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1400&q=80';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Fondo exterior difuminado con tinte azul oscuro AutoAdmin */}
      <div
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(37, 99, 235, 0.65)), url(${WORKSHOP_BG})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(10px)',
          zIndex: 0,
        }}
      />

      {/* Tarjeta principal más grande */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          width: '100%',
          maxWidth: '1100px',
          minHeight: '650px',
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Panel Izquierdo: Foto de taller con tinte + Branding */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 50%',
            backgroundImage: `linear-gradient(160deg, rgba(30, 36, 51, 0.82), rgba(37, 99, 235, 0.55)), url(${WORKSHOP_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '52px 80px 52px 52px',
            color: '#ffffff',
          }}
        >
          {/* Logo AutoAdmin arriba */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2 }}>
            <div
              style={{
                backgroundColor: '#2563eb',
                padding: '12px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
              }}
            >
              <Wrench size={28} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                AutoAdmin
              </h2>
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Gestión de Taller</span>
            </div>
          </div>

          {/* Texto inferior */}
          <div style={{ zIndex: 2 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '26px', fontWeight: '600', lineHeight: 1.3 }}>
              Control total de tu taller mecánico
            </h3>
            <p style={{ margin: 0, fontSize: '15px', color: '#e2e8f0', lineHeight: 1.6 }}>
              Administra órdenes de trabajo, vehículos, clientes e inventario desde un solo lugar.
            </p>
          </div>

          {/* Curva orgánica blanca (S-Wave) separando ambos paneles */}
          <svg
            viewBox="0 0 100 500"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              right: '-1px',
              height: '100%',
              width: '105px',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          >
            <path
              d="M 100 0 L 45 0 C -15 140, 115 340, 35 500 L 100 500 Z"
              fill="#ffffff"
            />
          </svg>
        </div>

        {/* Panel Derecho: Formulario limpio */}
        <div
          style={{
            flex: '1 1 50%',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '64px 64px 64px 40px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1
              style={{
                margin: '0 0 10px 0',
                fontSize: '38px',
                fontWeight: '600',
                color: '#1e2433',
                letterSpacing: '-0.5px',
              }}
            >
              Bienvenido
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#94a3b8' }}>
              Inicia sesión en tu cuenta para continuar
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                marginBottom: '24px',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Input Correo estilo píldora */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User size={20} color="#94a3b8" style={{ position: 'absolute', left: '20px' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@autoadmin.cl"
                required
                style={{
                  width: '100%',
                  padding: '15px 20px 15px 52px',
                  fontSize: '15px',
                  color: '#1e2433',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Input Contraseña estilo píldora */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={20} color="#94a3b8" style={{ position: 'absolute', left: '20px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: '100%',
                  padding: '15px 52px 15px 52px',
                  fontSize: '15px',
                  color: '#1e2433',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '9999px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Botón Ingresar estilo píldora centrado */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 56px',
                  backgroundColor: loading ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 8px 18px rgba(37, 99, 235, 0.3)',
                  transition: 'background-color 0.2s, transform 0.1s',
                }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: '40px',
              marginBottom: 0,
              fontSize: '13px',
              color: '#94a3b8',
            }}
          >
            AutoAdmin © 2026 · Sistema de Gestión Automotriz
          </p>
        </div>
      </div>
    </div>
  );
}