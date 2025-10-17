-- ===============================================
-- 📊 DATA WAREHOUSE TIENDA_CIPA
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
    fecha DATE NOT NULL,
    año INT NOT NULL,
    mes INT NOT NULL,
    trimestre INT NOT NULL,
    mes_nombre VARCHAR(20) NOT NULL,
    dia INT NOT NULL,
    dia_semana INT NOT NULL,
    dia_semana_nombre VARCHAR(20) NOT NULL,
    es_fin_semana BOOLEAN NOT NULL DEFAULT FALSE,
    es_festivo BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE KEY uk_fecha (fecha)
);

-- 🛍️ DIMENSIÓN PRODUCTO
CREATE TABLE dim_producto (
    producto_key INT PRIMARY KEY AUTO_INCREMENT,
    codigo_producto INT NOT NULL,
    nombre_producto VARCHAR(100) NOT NULL,
    tipo_producto VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    precio_actual DOUBLE NOT NULL,
    costo_actual DOUBLE NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    margen_actual DOUBLE GENERATED ALWAYS AS (
        CASE 
            WHEN precio_actual > 0 THEN ((precio_actual - costo_actual) / precio_actual) * 100
            ELSE 0 
        END
    ) STORED,
    categoria_stock VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN stock_actual = 0 THEN 'Sin Stock'
            WHEN stock_actual <= 10 THEN 'Bajo Stock'
            WHEN stock_actual <= 50 THEN 'Stock Normal'
            ELSE 'Alto Stock'
        END
    ) STORED,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_codigo_producto (codigo_producto)
);

-- 👥 DIMENSIÓN CLIENTE
CREATE TABLE dim_cliente (
    cliente_key INT PRIMARY KEY AUTO_INCREMENT,
    id_cliente_original INT NOT NULL,
    nombre_cliente VARCHAR(80) NOT NULL,
    genero_cliente ENUM('Femenino','Masculino','No especificado') DEFAULT 'No especificado',
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL,
    municipio VARCHAR(80) NOT NULL,
    edad INT,
    rango_edad VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN edad < 18 THEN 'Menor de 18'
            WHEN edad BETWEEN 18 AND 25 THEN '18-25 años'
            WHEN edad BETWEEN 26 AND 35 THEN '26-35 años'
            WHEN edad BETWEEN 36 AND 50 THEN '36-50 años'
            WHEN edad > 50 THEN 'Mayor de 50'
            ELSE 'No especificado'
        END
    ) STORED,
    segmento_cliente VARCHAR(20) DEFAULT 'Regular',
    email VARCHAR(100),
    telefono_principal VARCHAR(20),
    direccion VARCHAR(100),
    fecha_primer_compra DATE,
    fecha_ultima_compra DATE,
    total_compras_historico DOUBLE DEFAULT 0,
    numero_compras_historico INT DEFAULT 0,
    promedio_compra DOUBLE GENERATED ALWAYS AS (
        CASE 
            WHEN numero_compras_historico > 0 THEN total_compras_historico / numero_compras_historico
            ELSE 0 
        END
    ) STORED,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cliente_original (id_cliente_original)
);

-- 🌍 DIMENSIÓN UBICACIÓN
CREATE TABLE dim_ubicacion (
    ubicacion_key INT PRIMARY KEY AUTO_INCREMENT,
    id_municipio_original INT NOT NULL,
    nombre_municipio VARCHAR(80) NOT NULL,
    departamento VARCHAR(80) DEFAULT 'No especificado',
    region VARCHAR(50) DEFAULT 'No especificada',
    zona VARCHAR(20) DEFAULT 'Urbana',
    UNIQUE KEY uk_municipio_original (id_municipio_original)
);

-- 💳 DIMENSIÓN MEDIO DE PAGO
CREATE TABLE dim_medio_pago (
    medio_pago_key INT PRIMARY KEY AUTO_INCREMENT,
    id_medio_pago_original INT NOT NULL,
    nombre_medio_pago VARCHAR(50) NOT NULL,
    tipo_pago VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN LOWER(nombre_medio_pago) LIKE '%efectivo%' THEN 'Efectivo'
            WHEN LOWER(nombre_medio_pago) LIKE '%tarjeta%' OR LOWER(nombre_medio_pago) LIKE '%debito%' OR LOWER(nombre_medio_pago) LIKE '%credito%' THEN 'Tarjeta'
            WHEN LOWER(nombre_medio_pago) LIKE '%transferencia%' THEN 'Transferencia'
            ELSE 'Otro'
        END
    ) STORED,
    UNIQUE KEY uk_medio_pago_original (id_medio_pago_original)
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
    medio_pago_key INT,
    
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
    total_linea DOUBLE GENERATED ALWAYS AS (subtotal - descuento) STORED,
    
    -- Métricas calculadas
    utilidad_linea DOUBLE GENERATED ALWAYS AS (total_linea - (costo_unitario * cantidad_vendida)) STORED,
    margen_linea DOUBLE GENERATED ALWAYS AS (
        CASE 
            WHEN total_linea > 0 THEN ((total_linea - (costo_unitario * cantidad_vendida)) / total_linea) * 100
            ELSE 0 
        END
    ) STORED,
    
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
-- 📊 TABLA DE MÉTRICAS AGREGADAS (OPCIONAL)
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
    ticket_promedio DOUBLE GENERATED ALWAYS AS (
        CASE 
            WHEN numero_transacciones > 0 THEN total_ventas / numero_transacciones
            ELSE 0 
        END
    ) STORED,
    
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tiempo_key) REFERENCES dim_tiempo(tiempo_key),
    FOREIGN KEY (ubicacion_key) REFERENCES dim_ubicacion(ubicacion_key),
    
    UNIQUE KEY uk_tiempo_ubicacion (tiempo_key, ubicacion_key)
);

-- ===============================================
-- 📝 COMENTARIOS SOBRE EL DISEÑO
-- ===============================================

/*
ARQUITECTURA ESTRELLA (STAR SCHEMA):
├── CENTRO: fact_ventas (tabla de hechos principal)
├── BRAZO 1: dim_tiempo (dimensión temporal)
├── BRAZO 2: dim_producto (dimensión de productos)  
├── BRAZO 3: dim_cliente (dimensión de clientes)
├── BRAZO 4: dim_ubicacion (dimensión geográfica)
└── BRAZO 5: dim_medio_pago (dimensión de pagos)

VENTAJAS:
✅ Consultas rápidas (menos JOINs)
✅ Fácil de entender y mantener
✅ Optimizado para herramientas BI
✅ Excelente performance en agregaciones
✅ Escalabilidad horizontal

MÉTRICAS PRINCIPALES:
📊 Ventas: total, cantidad, utilidad
📈 Rendimiento: márgenes, ticket promedio  
👥 Clientes: segmentación, comportamiento
🌍 Geografía: ventas por ubicación
⏰ Tiempo: tendencias y estacionalidad
*/