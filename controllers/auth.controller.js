const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/* =========================================
   REGISTRO
========================================= */

const register = async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;

        const existeUsuario = await pool.query(
            `
            SELECT *
            FROM usuario
            WHERE correo = $1
            `,
            [correo]
        );

        if (existeUsuario.rows.length > 0) {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query('BEGIN');

        const usuario = await pool.query(
            `
            INSERT INTO usuario
            (
                nombre,
                correo,
                contrasena,
                rol
            )
            VALUES ($1, $2, $3, 'cliente')
            RETURNING *
            `,
            [nombre, correo, hashedPassword]
        );

        const idUsuario = usuario.rows[0].id_usuario;

        await pool.query(
            `
            INSERT INTO cliente (id_usuario)
            VALUES ($1)
            `,
            [idUsuario]
        );

        await pool.query(
            `
            INSERT INTO cuenta
            (
                id_usuario,
                saldo,
                tipo_cuenta
            )
            VALUES ($1, 0, 'debito')
            `,
            [idUsuario]
        );

        await pool.query('COMMIT');

        res.json({
            mensaje: 'Usuario registrado correctamente',
            usuario: {
                id_usuario: usuario.rows[0].id_usuario,
                nombre: usuario.rows[0].nombre,
                correo: usuario.rows[0].correo,
                rol: usuario.rows[0].rol
            }
        });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al registrar usuario',
            error: error.message
        });
    }
};

/* =========================================
   LOGIN
========================================= */

const login = async (req, res) => {
    try {
        const { correo, password } = req.body;

        const usuario = await pool.query(
            `
            SELECT *
            FROM usuario
            WHERE correo = $1
            `,
            [correo]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        if (usuario.rows[0].estado === 'bloqueado') {
            return res.status(403).json({
                mensaje: 'Usuario bloqueado. Contacta al administrador.'
            });
        }

        const passwordValido = await bcrypt.compare(
            password,
            usuario.rows[0].contrasena
        );

        if (!passwordValido) {
            return res.status(401).json({
                mensaje: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            {
                id_usuario: usuario.rows[0].id_usuario,
                rol: usuario.rows[0].rol
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        res.json({
            token,
            usuario: {
                id_usuario: usuario.rows[0].id_usuario,
                nombre: usuario.rows[0].nombre,
                correo: usuario.rows[0].correo,
                estado: usuario.rows[0].estado,
                rol: usuario.rows[0].rol
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};