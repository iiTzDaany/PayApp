const pool = require('../config/db');

/* =========================================
CREAR TRANSACCION
========================================= */

const crearTransaccion = async (req, res) => {

    try {

        const {
            id_cuenta_origen,
            id_cuenta_destino,
            monto,
            descripcion,
            id_tipo,
            id_estado
        } = req.body;

        /* =========================
        VALIDACIONES
        ========================= */

        if (
            !id_cuenta_origen ||
            !id_cuenta_destino ||
            !monto
        ) {

            return res.status(400).json({
                mensaje:'Datos incompletos'
            });

        }

        if(Number(monto) <= 0){

            return res.status(400).json({
                mensaje:'Monto inválido'
            });

        }

        if(
            Number(id_cuenta_origen) ===
            Number(id_cuenta_destino)
        ){

            return res.status(400).json({
                mensaje:'No puedes transferirte a ti mismo'
            });

        }

        /* =========================
        VERIFICAR CUENTA ORIGEN
        ========================= */

        const cuentaOrigen = await pool.query(
            `
            SELECT *
            FROM cuenta
            WHERE id_cuenta = $1
            `,
            [id_cuenta_origen]
        );

        if(cuentaOrigen.rows.length === 0){

            return res.status(404).json({
                mensaje:'Cuenta origen no encontrada'
            });

        }

        /* =========================
        VALIDAR PROPIETARIO
        ========================= */

        if(
            cuentaOrigen.rows[0].id_usuario !==
            req.usuario.id_usuario
        ){

            return res.status(403).json({
                mensaje:'No puedes usar cuentas ajenas'
            });

        }

        /* =========================
        VERIFICAR CUENTA DESTINO
        ========================= */

        const cuentaDestino = await pool.query(
            `
            SELECT *
            FROM cuenta
            WHERE id_cuenta = $1
            `,
            [id_cuenta_destino]
        );

        if(cuentaDestino.rows.length === 0){

            return res.status(404).json({
                mensaje:'Cuenta destino no encontrada'
            });

        }

        /* =========================
        VALIDAR SALDO
        ========================= */

        if(
            Number(cuentaOrigen.rows[0].saldo) <
            Number(monto)
        ){

            return res.status(400).json({
                mensaje:'Saldo insuficiente'
            });

        }

        /* =========================
        TRANSACCION SQL
        ========================= */

        await pool.query('BEGIN');

        /* DESCONTAR ORIGEN */

        await pool.query(
            `
            UPDATE cuenta
            SET saldo = saldo - $1
            WHERE id_cuenta = $2
            `,
            [
                monto,
                id_cuenta_origen
            ]
        );

        /* SUMAR DESTINO */

        await pool.query(
            `
            UPDATE cuenta
            SET saldo = saldo + $1
            WHERE id_cuenta = $2
            `,
            [
                monto,
                id_cuenta_destino
            ]
        );

        /* REGISTRAR TRANSACCION */

        const transaccion = await pool.query(
            `
            INSERT INTO transaccion
            (
                id_cuenta_origen,
                id_cuenta_destino,
                monto,
                fecha,
                descripcion,
                id_tipo,
                id_estado
            )
            VALUES
            (
                $1,
                $2,
                $3,
                CURRENT_TIMESTAMP,
                $4,
                $5,
                $6
            )
            RETURNING *
            `,
            [
                id_cuenta_origen,
                id_cuenta_destino,
                monto,
                descripcion || 'Transferencia',
                id_tipo || 1,
                id_estado || 2
            ]
        );

        /* AUDITORIA */

        await pool.query(
            `
            INSERT INTO auditoria
            (
                id_usuario,
                accion,
                tabla_afectada,
                detalle
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4
            )
            `,
            [
                req.usuario.id_usuario,
                'TRANSFERENCIA',
                'transaccion',
                `Transferencia de ${monto} de cuenta ${id_cuenta_origen} a cuenta ${id_cuenta_destino}`
            ]
        );

        await pool.query('COMMIT');

        res.json({
            mensaje:'Transferencia realizada',
            transaccion: transaccion.rows[0]
        });

    } catch (error) {

        await pool.query('ROLLBACK');

        console.log(error);

        res.status(500).json({
            mensaje:'Error al realizar transferencia',
            error:error.message
        });

    }

};

/* =========================================
OBTENER TRANSACCIONES
========================================= */

const obtenerTransacciones = async (req, res) => {

    try {

        /* =========================
        OBTENER CUENTAS USUARIO
        ========================= */

        const cuentas = await pool.query(
            `
            SELECT id_cuenta
            FROM cuenta
            WHERE id_usuario = $1
            `,
            [req.usuario.id_usuario]
        );

        if(cuentas.rows.length === 0){

            return res.json([]);

        }

        const idsCuentas =
            cuentas.rows.map(
                c => c.id_cuenta
            );

        /* =========================
        OBTENER TRANSACCIONES
        ========================= */

        const transacciones = await pool.query(
            `
            SELECT
                t.id_transaccion,
                t.id_cuenta_origen,
                t.id_cuenta_destino,
                t.monto,
                t.fecha,
                t.descripcion,
                t.id_tipo,
                t.id_estado,

                CASE

                    WHEN
                        t.id_cuenta_origen =
                        ANY($1::int[])

                    THEN 'enviada'

                    WHEN
                        t.id_cuenta_destino =
                        ANY($1::int[])

                    THEN 'recibida'

                    ELSE 'desconocida'

                END AS tipo_movimiento

            FROM transaccion t

            WHERE

                t.id_cuenta_origen =
                ANY($1::int[])

                OR

                t.id_cuenta_destino =
                ANY($1::int[])

            ORDER BY t.fecha DESC
            `,
            [idsCuentas]
        );

        res.json(
            transacciones.rows
        );

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje:'Error al obtener transacciones',
            error:error.message
        });

    }

};

module.exports = {

    crearTransaccion,

    obtenerTransacciones

};