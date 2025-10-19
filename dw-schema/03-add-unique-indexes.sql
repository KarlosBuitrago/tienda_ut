-- ================================================
-- ÍNDICES ÚNICOS PARA OPTIMIZAR ETL
-- Permiten usar INSERT ... ON DUPLICATE KEY UPDATE
-- ================================================

USE tienda_cipa_dw;

-- Productos: índice único en codigo_producto
CREATE UNIQUE INDEX IF NOT EXISTS idx_codigo_producto ON dim_producto (codigo_producto);

-- Clientes: índice único en id_cliente_original
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_cliente_original ON dim_cliente (id_cliente_original);

-- Ubicaciones: índice único en id_municipio_original  
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_municipio_original ON dim_ubicacion (id_municipio_original);

-- Medios de Pago: índice único en id_medio_pago_original
CREATE UNIQUE INDEX IF NOT EXISTS idx_id_medio_pago_original ON dim_medio_pago (id_medio_pago_original);

-- Tiempo: índice único en fecha
CREATE UNIQUE INDEX IF NOT EXISTS idx_fecha ON dim_tiempo (fecha);

-- Fact Ventas: índice compuesto para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_venta_producto ON fact_ventas (numero_venta_original, codigo_producto_original);

-- Índices adicionales para mejorar rendimiento de queries
CREATE INDEX IF NOT EXISTS idx_tiempo ON fact_ventas (tiempo_key);
CREATE INDEX IF NOT EXISTS idx_producto ON fact_ventas (producto_key);
CREATE INDEX IF NOT EXISTS idx_cliente ON fact_ventas (cliente_key);
CREATE INDEX IF NOT EXISTS idx_ubicacion ON fact_ventas (ubicacion_key);
CREATE INDEX IF NOT EXISTS idx_fecha_venta ON fact_ventas (fecha_venta_original);

SELECT 'Índices verificados/agregados exitosamente' as mensaje;
