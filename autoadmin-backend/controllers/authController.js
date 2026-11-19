const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = `
      SELECT 
        u.id_usuario, 
        u.email, 
        u.password_hash, 
        u.id_rol,
        r.nombre AS rol
      FROM usuario u
      INNER JOIN rol r ON u.id_rol = r.id_rol
      WHERE u.email = $1
    `;

    const result = await pool.query(query, [email]);
    console.log('1. Email recibido:', email);
    console.log('2. Filas encontradas:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    console.log('3. Hash en BD:', JSON.stringify(user.password_hash));

    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('4. ¿Contraseña válida?:', validPassword);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        id_usuario: user.id_usuario,
        id_rol: user.id_rol,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        email: user.email,
        id_rol: user.id_rol,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login };