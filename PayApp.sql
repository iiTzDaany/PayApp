-- =========================================
-- PAYAPP+ DATABASE
-- PostgreSQL
-- =========================================

CREATE DATABASE payapp;

-- =========================================
-- TABLAS PRINCIPALES
-- =========================================

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena TEXT NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    estado VARCHAR(20) DEFAULT 'activo'
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE administrador (
    id_admin SERIAL PRIMARY KEY,
    id_usuario INT UNIQUE NOT NULL,
    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

CREATE TABLE cuenta (
    id_cuenta SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    saldo NUMERIC(12,2) DEFAULT 0,
    tipo_cuenta VARCHAR(30) DEFAULT 'debito',

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
);

-- =========================================
-- CATÁLOGOS
-- =========================================

CREATE TABLE tipo_transaccion (
    id_tipo SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE estado_transaccion (
    id_estado SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE servicio (
    id_servicio SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    empresa_proveedora VARCHAR(100)
);

-- =========================================
-- TRANSACCIONES
-- =========================================

CREATE TABLE transaccion (
    id_transaccion SERIAL PRIMARY KEY,

    id_cuenta_origen INT,
    id_cuenta_destino INT,

    monto NUMERIC(12,2) NOT NULL,

    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    descripcion TEXT,

    id_tipo INT NOT NULL,
    id_estado INT NOT NULL,

    FOREIGN KEY (id_cuenta_origen)
        REFERENCES cuenta(id_cuenta),

    FOREIGN KEY (id_cuenta_destino)
        REFERENCES cuenta(id_cuenta),

    FOREIGN KEY (id_tipo)
        REFERENCES tipo_transaccion(id_tipo),

    FOREIGN KEY (id_estado)
        REFERENCES estado_transaccion(id_estado)
);

-- =========================================
-- PAGOS
-- =========================================

CREATE TABLE pago (
    id_pago SERIAL PRIMARY KEY,

    id_transaccion INT NOT NULL,

    id_servicio INT NOT NULL,

    referencia VARCHAR(100) NOT NULL,

    FOREIGN KEY (id_transaccion)
        REFERENCES transaccion(id_transaccion)
        ON DELETE CASCADE,

    FOREIGN KEY (id_servicio)
        REFERENCES servicio(id_servicio)
);

-- =========================================
-- AUDITORIA
-- =========================================

CREATE TABLE auditoria (
    id_auditoria SERIAL PRIMARY KEY,

    id_usuario INT,

    accion VARCHAR(100),

    tabla_afectada VARCHAR(100),

    detalle TEXT,

    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
);

-- =========================================
-- DATOS INICIALES
-- =========================================

INSERT INTO tipo_transaccion (nombre)
VALUES
('transferencia'),
('pago_servicio'),
('asignacion_admin');

INSERT INTO estado_transaccion (nombre)
VALUES
('pendiente'),
('completado'),
('cancelado');

INSERT INTO servicio (nombre, empresa_proveedora)
VALUES
('Electricidad', 'CFE'),
('Internet', 'Telmex'),
('Agua', 'SACMEX'),
('Telefonía', 'Telcel'),
('Streaming', 'Netflix');

-- =========================================
-- USUARIO ADMINISTRADOR
-- =========================================

INSERT INTO usuario
(
    nombre,
    correo,
    contrasena,
    rol,
    estado
)
VALUES
(
    'Administrador',
    'admin@payapp.com',

    '$2b$10$wX4nS7k1B8m7g6Q3V8nL9e1QWjV9u7Y8lD1Q0aL2xM4uG8hYxW5QW',

    'admin',
    'activo'
);

INSERT INTO administrador (id_usuario)
VALUES (1);

INSERT INTO cuenta
(
    id_usuario,
    saldo,
    tipo_cuenta
)
VALUES
(
    1,
    100000,
    'administrativa'
);