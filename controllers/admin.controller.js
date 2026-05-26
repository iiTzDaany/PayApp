const pool = require('../config/db');

const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await pool.query(`
            SELECT
                u.id_usuario,
                u.nombre,
                u.correo,
                u.estado,
                u.rol,
                c.id_cuenta,
                c.saldo,
                c.tipo_cuenta
            FROM usuario u
            LEFT JOIN cuenta c ON u.id_usuario = c.id_usuario
            ORDER BY u.id_usuario
        `);

        res.json(usuarios.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

const obtenerTodasTransacciones = async (req, res) => {
    try {
        const transacciones = await pool.query(`
            SELECT
                t.id_transaccion,
                t.id_cuenta_origen,
                uo.nombre AS usuario_origen,
                t.id_cuenta_destino,
                ud.nombre AS usuario_destino,
                t.monto,
                t.descripcion,
                t.fecha,
                tt.nombre AS tipo_transaccion,
                et.nombre AS estado_transaccion
            FROM transaccion t
            LEFT JOIN cuenta co ON t.id_cuenta_origen = co.id_cuenta
            LEFT JOIN usuario uo ON co.id_usuario = uo.id_usuario
            LEFT JOIN cuenta cd ON t.id_cuenta_destino = cd.id_cuenta
            LEFT JOIN usuario ud ON cd.id_usuario = ud.id_usuario
            LEFT JOIN tipo_transaccion tt ON t.id_tipo = tt.id_tipo
            LEFT JOIN estado_transaccion et ON t.id_estado = et.id_estado
            ORDER BY t.fecha DESC
        `);

        res.json(transacciones.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

const asignarSaldo = async (req, res) => {
    try {
        const { id_cuenta, monto } = req.body;

        if (!id_cuenta || !monto || Number(monto) <= 0) {
            return res.status(400).json({
                mensaje: 'Cuenta y monto válido son requeridos'
            });
        }

        await pool.query('BEGIN');

        const cuenta = await pool.query(
            `
            UPDATE cuenta
            SET saldo = saldo + $1
            WHERE id_cuenta = $2
            RETURNING *
            `,
            [Number(monto), Number(id_cuenta)]
        );

        if (cuenta.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                mensaje: 'Cuenta no encontrada'
            });
        }

        const tipo = await pool.query(
            `
            SELECT id_tipo
            FROM tipo_transaccion
            WHERE nombre = 'asignacion_admin'
            `
        );

        let idTipo;

        if (tipo.rows.length === 0) {
            const nuevoTipo = await pool.query(
                `
                INSERT INTO tipo_transaccion(nombre)
                VALUES ('asignacion_admin')
                RETURNING id_tipo
                `
            );

            idTipo = nuevoTipo.rows[0].id_tipo;
        } else {
            idTipo = tipo.rows[0].id_tipo;
        }

        const estado = await pool.query(
            `
            SELECT id_estado
            FROM estado_transaccion
            WHERE nombre = 'completado'
            `
        );

        const idEstado = estado.rows[0].id_estado;

        await pool.query(
            `
            INSERT INTO transaccion
            (
                id_cuenta_origen,
                id_cuenta_destino,
                monto,
                descripcion,
                id_tipo,
                id_estado
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                null,
                Number(id_cuenta),
                Number(monto),
                'Asignación de saldo por administrador',
                idTipo,
                idEstado
            ]
        );

        await pool.query(
            `
            INSERT INTO auditoria
            (id_usuario, accion, tabla_afectada, detalle)
            VALUES ($1, $2, $3, $4)
            `,
            [
                req.usuario.id_usuario,
                'ASIGNAR_SALDO',
                'cuenta',
                `Se asignó saldo de ${monto} a la cuenta ${id_cuenta}`
            ]
        );

        await pool.query('COMMIT');

        res.json({
            mensaje: 'Saldo asignado correctamente',
            cuenta: cuenta.rows[0]
        });

    } catch (error) {
        await pool.query('ROLLBACK');

        console.log(error);

        res.status(500).json({
            mensaje: 'Error al asignar saldo',
            error: error.message
        });
    }
};

const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id_usuario, estado } = req.body;

        if (!['activo', 'bloqueado'].includes(estado)) {
            return res.status(400).json({
                mensaje: 'Estado inválido'
            });
        }

        const usuario = await pool.query(
            `
            UPDATE usuario
            SET estado = $1
            WHERE id_usuario = $2
            RETURNING id_usuario, nombre, correo, estado, rol
            `,
            [estado, id_usuario]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        await pool.query(
            `
            INSERT INTO auditoria
            (id_usuario, accion, tabla_afectada, detalle)
            VALUES ($1, $2, $3, $4)
            `,
            [
                req.usuario.id_usuario,
                'CAMBIAR_ESTADO_USUARIO',
                'usuario',
                `Se cambió el estado del usuario ${id_usuario} a ${estado}`
            ]
        );

        res.json({
            mensaje: 'Estado actualizado',
            usuario: usuario.rows[0]
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

const cambiarRolUsuario = async (req, res) => {
    try {
        const { id_usuario, rol } = req.body;

        if (!['cliente', 'admin'].includes(rol)) {
            return res.status(400).json({
                mensaje: 'Rol inválido'
            });
        }

        const usuario = await pool.query(
            `
            UPDATE usuario
            SET rol = $1
            WHERE id_usuario = $2
            RETURNING id_usuario, nombre, correo, estado, rol
            `,
            [rol, id_usuario]
        );

        if (usuario.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        if (rol === 'admin') {
            await pool.query(
                `
                INSERT INTO administrador (id_usuario)
                VALUES ($1)
                ON CONFLICT (id_usuario) DO NOTHING
                `,
                [id_usuario]
            );
        }

        res.json({
            mensaje: 'Rol actualizado',
            usuario: usuario.rows[0]
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }
};

module.exports = {
    obtenerUsuarios,
    obtenerTodasTransacciones,
    asignarSaldo,
    cambiarEstadoUsuario,
    cambiarRolUsuario
};

