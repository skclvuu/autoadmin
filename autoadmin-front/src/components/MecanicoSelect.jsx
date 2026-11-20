import { useState, useRef, useEffect } from 'react';

export default function MecanicoSelect({
  mecanicos = [],
  value,
  onChange,
  name = 'id_mecanico',
  placeholder = 'Seleccione mecánico...',
  style = {},
  required = false,
  formato = (m) => m.nombre || m.nombre_mecanico || ''
}) {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  const getId = (m) => m.id_mecanico ?? m.id_usuario ?? m.id;
  const seleccionado = mecanicos.find((m) => String(getId(m)) === String(value));

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
        setBusqueda('');
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const filtrados = mecanicos.filter((m) =>
    formato(m).toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSeleccionar = (mecanico) => {
    onChange({
      target: {
        name,
        value: getId(mecanico)
      }
    });
    setBusqueda('');
    setAbierto(false);
  };

  return (
    <div ref={contenedorRef} style={{ position: 'relative', width: '100%', marginTop: style.marginTop || '6px' }}>
      {required && (
        <input
          type="text"
          value={value || ''}
          onChange={() => {}}
          required
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0 }}
        />
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={abierto ? busqueda : seleccionado ? formato(seleccionado) : ''}
          onFocus={() => {
            setAbierto(true);
            setBusqueda('');
          }}
          onChange={(e) => {
            setBusqueda(e.target.value);
            if (!abierto) setAbierto(true);
          }}
          placeholder={seleccionado ? formato(seleccionado) : placeholder}
          style={{ ...style, marginTop: 0, width: '100%', paddingRight: '32px', boxSizing: 'border-box' }}
        />

        <span
          onClick={() => setAbierto((prev) => !prev)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: `translateY(-50%) rotate(${abierto ? '180deg' : '0deg'})`,
            cursor: 'pointer',
            fontSize: '11px',
            color: '#64748b',
            userSelect: 'none',
            transition: 'transform 0.15s'
          }}
        >
          ▼
        </span>
      </div>

      {abierto && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            margin: '4px 0 0 0',
            padding: '4px 0',
            listStyle: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)'
          }}
        >
          {filtrados.length > 0 ? (
            filtrados.map((m) => {
              const id = getId(m);
              const esSeleccionado = String(id) === String(value);
              return (
                <li
                  key={id}
                  onClick={() => handleSeleccionar(m)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    backgroundColor: esSeleccionado ? '#eff6ff' : 'transparent',
                    fontWeight: esSeleccionado ? '600' : '400',
                    color: esSeleccionado ? '#1d4ed8' : '#1e293b'
                  }}
                  onMouseEnter={(e) => {
                    if (!esSeleccionado) e.currentTarget.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!esSeleccionado) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {formato(m)}
                </li>
              );
            })
          ) : (
            <li style={{ padding: '8px 12px', fontSize: '14px', color: '#94a3b8' }}>
              No se encontraron mecánicos
            </li>
          )}
        </ul>
      )}
    </div>
  );
}