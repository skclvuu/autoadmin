const express = require('express');
const cors = require('cors');
const db = require('./db'); // Importamos nuestra conexión a PostgreSQL
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// 0. Endpoint de salud (prueba de humo del despliegue)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 1. Ruta de prueba para verificar que PostgreSQL responde
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS hora_actual');
    res.json({ mensaje: '¡Conexión exitosa a PostgreSQL!', hora: result.rows[0].hora_actual });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error conectando a la base de datos' });
  }
});

app.get('/api/mecanicos', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id_mecanico, nombre FROM mecanico WHERE activo = true ORDER BY nombre ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mecánicos:', error);
    res.status(500).json({ error: 'Error al obtener mecánicos' });
  }
});

// ==========================================
// RUTAS DEL MÓDULO DE INVENTARIO (REPUESTOS)
// ==========================================

app.get('/api/inventario', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM repuesto ORDER BY id_repuesto ASC');
    
    const inventario = result.rows.map(item => {
      const stock = parseFloat(item.stock_actual);
      const min = parseFloat(item.stock_minimo);
      const esCritico = stock <= min;
      
      return {
        sku: item.codigo,
        nombre: item.nombre,
        cat: 'N/A', // Omitido del nuevo diagrama lógico
        ubi: item.ubicacion || 'Sin ubicación',
        stock: stock,
        min: min,
        estado: esCritico ? 'CRÍTICO' : 'OK',
        bg: esCritico ? '#fee2e2' : '#dcfce3',
        text: esCritico ? '#b91c1c' : '#15803d'
      };
    });

    res.json(inventario);
  } catch (error) {
    console.error('Error obteniendo el inventario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/inventario', async (req, res) => {
  try {
    const { sku, nombre, stock, min, ubi, ubicacion } = req.body;
    const query = `
      INSERT INTO repuesto (codigo, nombre, stock_actual, stock_minimo, ubicacion) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    await db.query(query, [sku, nombre, stock, min, ubi || ubicacion || 'Bodega General']);
    res.status(201).json({ mensaje: 'Repuesto guardado exitosamente' });
  } catch (error) {
    console.error('Error al guardar el repuesto:', error);
    res.status(500).json({ error: 'Error interno guardando en la BD' });
  }
});

app.put('/api/inventario/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { nombre, stock_actual, stock_minimo, ubicacion, ubi } = req.body;
    const query = `
      UPDATE repuesto 
      SET nombre = $1, stock_actual = $2, stock_minimo = $3, ubicacion = $4 
      WHERE codigo = $5
    `;
    await db.query(query, [nombre, stock_actual, stock_minimo, ubicacion || ubi || 'Bodega General', sku]);
    res.json({ mensaje: 'Repuesto actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando:', error);
    res.status(500).json({ error: 'Error interno actualizando la BD' });
  }
});

app.delete('/api/inventario/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    await db.query('DELETE FROM repuesto WHERE codigo = $1', [sku]);
    res.json({ mensaje: 'Repuesto eliminado' });
  } catch (error) {
    console.error('Error eliminando:', error);
    res.status(500).json({ error: 'Error interno eliminando en la BD' });
  }
});

// ==========================================
// RUTAS DEL MÓDULO DE CLIENTES
// ==========================================

app.get('/api/clientes', async (req, res) => {
  try {
    const query = 'SELECT id_cliente, rut, nombre_razon_social as nombre, telefono, email, direccion FROM cliente ORDER BY id_cliente DESC';
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { rut, nombre, telefono, email, direccion } = req.body;
    const query = 'INSERT INTO cliente (tipo_cliente, nombre_razon_social, rut, telefono, email, direccion) VALUES ($1, $2, $3, $4, $5, $6)';
    await db.query(query, ['Persona', nombre, rut, telefono, email, direccion]);
    res.status(201).json({ mensaje: 'Cliente guardado exitosamente' });
  } catch (error) {
    console.error('Error guardando cliente:', error);
    res.status(500).json({ error: 'Error interno al guardar en BD' });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rut, nombre, telefono, email, direccion } = req.body;
    const query = 'UPDATE cliente SET nombre_razon_social = $1, rut = $2, telefono = $3, email = $4, direccion = $5 WHERE id_cliente = $6';
    await db.query(query, [nombre, rut, telefono, email, direccion, id]);
    res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ error: 'Error interno al actualizar BD' });
  }
});


// ==========================================
// RUTAS DEL MÓDULO DE VEHÍCULOS
// ==========================================

app.get('/api/vehiculos', async (req, res) => {
  try {
    const query = `
      SELECT v.*, c.nombre_razon_social as nombre_cliente 
      FROM vehiculo v 
      LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
      ORDER BY v.id_vehiculo DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo vehículos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/vehiculos/:patente', async (req, res) => {
  try {
    const { patente } = req.params;
    
    const query = `
      SELECT 
        v.*, 
        c.nombre_razon_social as nombre_cliente,
        ot.diagnostico,
        ot.fecha_ingreso,
        ot.estado
      FROM vehiculo v 
      LEFT JOIN cliente c ON v.id_cliente = c.id_cliente 
      LEFT JOIN orden_trabajo ot ON v.id_vehiculo = ot.id_vehiculo
      WHERE v.patente = $1
      ORDER BY ot.fecha_ingreso DESC
      LIMIT 1
    `;
    const result = await db.query(query, [patente]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    res.json(result.rows[0]); 
    
  } catch (error) {
    console.error('Error buscando patente:', error);
    res.status(500).json({ error: 'Error interno al buscar el vehículo' });
  }
});

app.post('/api/vehiculos', async (req, res) => {
  try {
    const { patente, marca, modelo, anio, id_cliente } = req.body;
    const query = 'INSERT INTO vehiculo (patente, marca, modelo, anio, id_cliente) VALUES ($1, $2, $3, $4, $5)';
    await db.query(query, [patente, marca, modelo, anio, id_cliente]);
    res.status(201).json({ mensaje: 'Vehículo guardado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar en BD' });
  }
});

app.put('/api/vehiculos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { patente, marca, modelo, anio, id_cliente } = req.body;
    const query = 'UPDATE vehiculo SET patente = $1, marca = $2, modelo = $3, anio = $4, id_cliente = $5 WHERE id_vehiculo = $6';
    await db.query(query, [patente, marca, modelo, anio, id_cliente, id]);
    res.json({ mensaje: 'Vehículo actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando vehículo:', error);
    res.status(500).json({ error: 'Error interno al actualizar la BD' });
  }
});

// ==========================================
// RUTAS DEL MÓDULO DE ÓRDENES DE TRABAJO
// ==========================================
app.get('/api/ordenes', async (req, res) => {
  try {
    const query = `
      SELECT o.id_ot as id_orden, o.fecha_ingreso, o.diagnostico as descripcion_falla, o.estado, o.total_estimado,
             o.id_mecanico, m.nombre as nombre_mecanico,
             v.patente, c.nombre_razon_social as nombre_cliente
      FROM orden_trabajo o
      JOIN vehiculo v ON o.id_vehiculo = v.id_vehiculo
      JOIN cliente c ON v.id_cliente = c.id_cliente
      LEFT JOIN mecanico m ON o.id_mecanico = m.id_mecanico
      ORDER BY o.id_ot DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({ error: 'Error obteniendo órdenes' });
  }
});

app.post('/api/ordenes', async (req, res) => {
  try {
    const { id_vehiculo, id_mecanico, descripcion_falla, total_estimado } = req.body;
    const query = `
      INSERT INTO orden_trabajo (id_vehiculo, id_mecanico, diagnostico, total_estimado, creado_por)
      VALUES ($1, $2, $3, $4, 1)
    `;
    await db.query(query, [id_vehiculo, id_mecanico || null, descripcion_falla, total_estimado || 0]);
    res.status(201).json({ mensaje: 'Orden creada exitosamente' });
  } catch (error) {
    console.error('Error al guardar orden:', error);
    res.status(500).json({ error: 'Error al guardar orden' });
  }
});

app.put('/api/ordenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion_falla, estado, total_estimado, id_mecanico } = req.body;
    
    const query = `
      UPDATE orden_trabajo 
      SET diagnostico = $1, estado = $2, total_estimado = $3, id_mecanico = $4
      WHERE id_ot = $5
    `;
    
    await db.query(query, [descripcion_falla, estado, total_estimado, id_mecanico || null, id]);
    res.json({ mensaje: 'Orden de trabajo actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando orden:', error);
    res.status(500).json({ error: 'Error interno al actualizar la orden' });
  }
});

// ==========================================
// RUTA DEL MÓDULO: CONSULTA POR PATENTE
// ==========================================

app.get('/api/consulta/:patente', async (req, res) => {
  try {
    const { patente } = req.params;
    
    const queryVehiculo = `
      SELECT v.*, c.nombre_razon_social as nombre_cliente, c.rut, c.telefono, c.email
      FROM vehiculo v
      JOIN cliente c ON v.id_cliente = c.id_cliente
      WHERE UPPER(v.patente) = UPPER($1)
    `;
    const resultVehiculo = await db.query(queryVehiculo, [patente]);
    
    if (resultVehiculo.rows.length === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    
    const vehiculo = resultVehiculo.rows[0];
    
    const queryOrdenes = `
      SELECT id_ot as id_orden, fecha_ingreso, diagnostico as descripcion_falla, estado, total_estimado
      FROM orden_trabajo
      WHERE id_vehiculo = $1
      ORDER BY id_ot DESC
    `;
    const resultOrdenes = await db.query(queryOrdenes, [vehiculo.id_vehiculo]);
    
    res.json({ vehiculo, historial: resultOrdenes.rows });
  } catch (error) {
    console.error('Error en consulta por patente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// RUTAS DEL MÓDULO DE COTIZACIONES (Híbrido)
// ==========================================

app.get('/api/cotizaciones', async (req, res) => {
  try {
    const query = `
      SELECT coti.*, 
             COALESCE(v.patente, 'S/P') as patente, 
             COALESCE(c.nombre_razon_social, coti.vehiculo_temporal, 'Cliente de Paso') as nombre_cliente
      FROM cotizacion coti
      LEFT JOIN vehiculo v ON coti.id_vehiculo = v.id_vehiculo
      LEFT JOIN cliente c ON v.id_cliente = c.id_cliente
      ORDER BY coti.id_cotizacion DESC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/cotizaciones', async (req, res) => {
  try {
    const { id_vehiculo, vehiculo_temporal, detalle, total } = req.body;
    const idFinal = id_vehiculo ? id_vehiculo : null; 
    
    const query = 'INSERT INTO cotizacion (id_vehiculo, vehiculo_temporal, detalle, total) VALUES ($1, $2, $3, $4)';
    await db.query(query, [idFinal, vehiculo_temporal, detalle, total]);
    res.status(201).json({ mensaje: 'Cotización creada exitosamente' });
  } catch (error) {
    console.error('Error guardando cotización:', error);
    res.status(500).json({ error: 'Error interno al guardar en BD' });
  }
});

app.put('/api/cotizaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { detalle, total, estado } = req.body;
    const query = 'UPDATE cotizacion SET detalle = $1, total = $2, estado = $3 WHERE id_cotizacion = $4';
    await db.query(query, [detalle, total, estado, id]);
    res.json({ mensaje: 'Cotización actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando cotización:', error);
    res.status(500).json({ error: 'Error interno al actualizar BD' });
  }
});

app.post('/api/cotizaciones/:id/enviar', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, nombre_cliente, detalle, total } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El cliente no tiene un email registrado' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tu_correo@gmail.com', 
        pass: 'tu_contraseña_de_aplicacion' 
      }
    });

    const neto = Math.round(total / 1.19);
    const iva = total - neto;

    const mailOptions = {
      from: 'AutoAdmin Taller <tu_correo@gmail.com>',
      to: email,
      subject: `Cotización de Servicio #${id} - AutoAdmin`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">AutoAdmin - Taller Mecánico</h2>
          <p>Hola <strong>${nombre_cliente}</strong>,</p>
          <p>Adjuntamos el detalle de su cotización solicitada:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p><strong>Detalle del servicio:</strong> ${detalle}</p>
            <p><strong>Valor Neto:</strong> $${neto.toLocaleString('es-CL')}</p>
            <p><strong>IVA (19%):</strong> $${iva.toLocaleString('es-CL')}</p>
            <h3 style="color: #0f172a;">Total a Pagar: $${Number(total).toLocaleString('es-CL')}</h3>
          </div>
          <p>Para aprobar este presupuesto, por favor responda a este correo.</p>
          <p>Saludos cordiales,<br>El equipo de AutoAdmin.</p>
        </div>
      `
    };
    
    console.log(`Correo simulado enviado a ${email}`);
    res.json({ mensaje: 'Cotización enviada exitosamente al correo del cliente' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ error: 'Error interno al enviar el correo' });
  }
});

// ==========================================
// RUTA DEL DASHBOARD (Métricas Reales)
// ==========================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Contamos vehículos
    const vehiculosRes = await db.query('SELECT COUNT(*) as total FROM vehiculo');
    
    // Contamos órdenes por estado
    const diagnosticoRes = await db.query("SELECT COUNT(*) as total FROM orden_trabajo WHERE estado = 'Pendiente' OR estado = 'Ingresada'");
    const reparacionRes = await db.query("SELECT COUNT(*) as total FROM orden_trabajo WHERE estado = 'En Proceso'");
    const listosRes = await db.query("SELECT COUNT(*) as total FROM orden_trabajo WHERE estado = 'Terminado'");
    
    // Traemos las últimas 5 órdenes
    const recientesRes = await db.query(`
      SELECT o.id_ot as id_orden, v.patente, c.nombre_razon_social as cliente, o.diagnostico as trabajo, o.estado
      FROM orden_trabajo o
      JOIN vehiculo v ON o.id_vehiculo = v.id_vehiculo
      JOIN cliente c ON v.id_cliente = c.id_cliente
      ORDER BY o.id_ot DESC LIMIT 5
    `);

    res.json({
      vehiculos: vehiculosRes.rows[0].total,
      en_diagnostico: diagnosticoRes.rows[0].total,
      en_reparacion: reparacionRes.rows[0].total,
      listos: listosRes.rows[0].total,
      recientes: recientesRes.rows.length > 0 ? recientesRes.rows : [] 
    });
  } catch (error) {
    console.error('Error dashboard:', error);
    res.status(500).json({ error: 'Error cargando dashboard' });
  }
});

// ==========================================
// FRONTEND (build de React servido por Express)
// ==========================================
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));
// Cualquier GET que no sea /api devuelve index.html (la app React maneja la vista)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'), (err) => { if (err) next(); });
});


// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
