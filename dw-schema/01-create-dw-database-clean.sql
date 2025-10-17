-- ===============================================
-- 📊 DATA WAREHOUSE TIENDA_CIPA (VERSIÓN SIMPLIFICADA)
-- Arquitectura: Esquema Estrella (Star Schema)
-- ===============================================

-- Crear nueva base de datos para el Data Warehouse
DROP DATABASE IF EXISTS tienda_cipa_dw;
CREATE DATABASE tienda_cipa_dw;
USE tienda_cipa_dw;

-- ===============================================
-- 🔍 TABLAS DE DIMENSIONES (DIMENSION TABLES)
-- ===============================================

-- 📅 DIMENSIÓN TIEMPO
CREATE TABLE dim_tiempo (
    tiempo_key INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL UNIQUE,
    año INT NOT NULL,
    mes INT NOT NULL,
    trimestre INT NOT NULL,
    mes_nombre VARCHAR(20) NOT NULL,
    dia INT NOT NULL,
    dia_semana INT NOT NULL,
    dia_semana_nombre VARCHAR(20) NOT NULL,
    es_fin_semana BOOLEAN NOT NULL DEFAULT FALSE,
    es_festivo BOOLEAN NOT NULL DEFAULT FALSE
);

-- 🛍️ DIMENSIÓN PRODUCTO
CREATE TABLE dim_producto (
    producto_key INT PRIMARY KEY AUTO_INCREMENT,
    codigo_producto INT NOT NULL UNIQUE,
    nombre_producto VARCHAR(100) NOT NULL,
    tipo_producto VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    precio_actual DOUBLE NOT NULL,
    costo_actual DOUBLE NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    margen_actual DOUBLE DEFAULT 0,
    categoria_stock VARCHAR(20) DEFAULT 'Normal',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 👥 DIMENSIÓN CLIENTE
CREATE TABLE dim_cliente (
    cliente_key INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente_original INT NOT NULL UNIQUE,
    nombre_cliente VARCHAR(80) NOT NULL,
    genero_cliente VARCHAR(20) DEFAULT 'No especificado',
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    municipio VARCHAR(80) NOT NULL,
    edad INT DEFAULT NULL,
    rango_edad VARCHAR(20) DEFAULT 'No especificado',
    segmento_cliente VARCHAR(20) DEFAULT 'Regular',
    email VARCHAR(100),
    telefono_principal VARCHAR(20),
    direccion VARCHAR(100),
    fecha_primer_compra DATE,
    fecha_ultima_compra DATE,
    total_compras_historico DOUBLE DEFAULT 0,
    numero_compras_historico INT DEFAULT 0,
    promedio_compra DOUBLE DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 🌍 DIMENSIÓN UBICACIÓN
CREATE TABLE dim_ubicacion (
    ubicacion_key INT PRIMARY KEY AUTO_INCREMENT,
    id_municipio_original INT NOT NULL UNIQUE,
    nombre_municipio VARCHAR(80) NOT NULL,
    departamento VARCHAR(80) DEFAULT 'No especificado',
    region VARCHAR(50) DEFAULT 'No especificada',
    zona VARCHAR(20) DEFAULT 'Urbana'
);

-- 💳 DIMENSIÓN MEDIO DE PAGO
CREATE TABLE dim_medio_pago (
    medio_pago_key INT PRIMARY KEY AUTO_INCREMENT,
    id_medio_pago_original INT NOT NULL UNIQUE,
    nombre_medio_pago VARCHAR(50) NOT NULL,
    tipo_pago VARCHAR(20) DEFAULT 'Otro'
);

-- ===============================================
-- 📈 TABLA DE HECHOS (FACT TABLE)
-- ===============================================

-- 💰 HECHOS DE VENTAS
CREATE TABLE fact_ventas (
    venta_key BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Claves foráneas a dimensiones
    tiempo_key INT NOT NULL,
    producto_key INT NOT NULL,
    cliente_key INT NOT NULL,
    ubicacion_key INT NOT NULL,
    medio_pago_key INT DEFAULT NULL,
    
    -- Identificadores del sistema operacional
    numero_venta_original INT NOT NULL,
    codigo_producto_original INT NOT NULL,
    id_cliente_original INT NOT NULL,
    
    -- Métricas de negocio
    cantidad_vendida INT NOT NULL DEFAULT 1,
    precio_unitario DOUBLE NOT NULL,
    costo_unitario DOUBLE NOT NULL,
    subtotal DOUBLE NOT NULL,
    descuento DOUBLE DEFAULT 0,
    total_linea DOUBLE NOT NULL,
    utilidad_linea DOUBLE DEFAULT 0,
    margen_linea DOUBLE DEFAULT 0,
    
    -- Información adicional
    tipo_venta VARCHAR(20) DEFAULT 'Contado',
    fecha_venta_original TIMESTAMP NOT NULL,
    
    -- Timestamps de control
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (tiempo_key) REFERENCES dim_tiempo(tiempo_key),
    FOREIGN KEY (producto_key) REFERENCES dim_producto(producto_key),
    FOREIGN KEY (cliente_key) REFERENCES dim_cliente(cliente_key),
    FOREIGN KEY (ubicacion_key) REFERENCES dim_ubicacion(ubicacion_key),
    FOREIGN KEY (medio_pago_key) REFERENCES dim_medio_pago(medio_pago_key),
    
    -- Índices para optimizar consultas
    INDEX idx_tiempo (tiempo_key),
    INDEX idx_producto (producto_key),
    INDEX idx_cliente (cliente_key),
    INDEX idx_ubicacion (ubicacion_key),
    INDEX idx_fecha_venta (fecha_venta_original),
    INDEX idx_numero_venta (numero_venta_original)
);

-- ===============================================
-- 📊 TABLA DE MÉTRICAS AGREGADAS
-- ===============================================

-- 📈 RESUMEN DIARIO DE VENTAS
CREATE TABLE fact_ventas_diario (
    resumen_key INT PRIMARY KEY AUTO_INCREMENT,
    tiempo_key INT NOT NULL,
    ubicacion_key INT NOT NULL,
    
    -- Métricas agregadas del día
    total_ventas DOUBLE NOT NULL DEFAULT 0,
    total_cantidad_productos INT NOT NULL DEFAULT 0,
    total_utilidad DOUBLE NOT NULL DEFAULT 0,
    numero_transacciones INT NOT NULL DEFAULT 0,
    numero_clientes_unicos INT NOT NULL DEFAULT 0,
    ticket_promedio DOUBLE DEFAULT 0,
    
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tiempo_key) REFERENCES dim_tiempo(tiempo_key),
    FOREIGN KEY (ubicacion_key) REFERENCES dim_ubicacion(ubicacion_key),
    
    UNIQUE KEY uk_tiempo_ubicacion (tiempo_key, ubicacion_key)
);

-- ===============================================
-- ✅ VERIFICACIÓN DE TABLAS CREADAS
-- ===============================================

SELECT 'Data Warehouse creado exitosamente' as status;
SHOW TABLES;