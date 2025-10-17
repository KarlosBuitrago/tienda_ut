-- ===============================================
-- 📅 POBLACIÓN SIMPLIFICADA DE LA DIMENSIÓN TIEMPO
-- ===============================================

USE tienda_cipa_dw;

-- Insertar fechas para los años 2023, 2024 y 2025
-- (período relevante para el análisis actual)

INSERT INTO dim_tiempo (
    fecha, año, mes, trimestre, mes_nombre, dia, 
    dia_semana, dia_semana_nombre, es_fin_semana, es_festivo
) VALUES
-- 2023
('2023-01-01', 2023, 1, 1, 'Enero', 1, 7, 'Domingo', TRUE, TRUE),  -- Año Nuevo
('2023-01-02', 2023, 1, 1, 'Enero', 2, 1, 'Lunes', FALSE, FALSE),
('2023-01-03', 2023, 1, 1, 'Enero', 3, 2, 'Martes', FALSE, FALSE),
('2023-01-04', 2023, 1, 1, 'Enero', 4, 3, 'Miércoles', FALSE, FALSE),
('2023-01-05', 2023, 1, 1, 'Enero', 5, 4, 'Jueves', FALSE, FALSE),
('2023-01-06', 2023, 1, 1, 'Enero', 6, 5, 'Viernes', FALSE, FALSE),
('2023-01-07', 2023, 1, 1, 'Enero', 7, 6, 'Sábado', TRUE, FALSE),
('2023-01-08', 2023, 1, 1, 'Enero', 8, 7, 'Domingo', TRUE, FALSE),

-- Agregar algunas fechas importantes de 2024
('2024-01-01', 2024, 1, 1, 'Enero', 1, 1, 'Lunes', FALSE, TRUE),   -- Año Nuevo
('2024-01-15', 2024, 1, 1, 'Enero', 15, 1, 'Lunes', FALSE, FALSE),
('2024-02-14', 2024, 2, 1, 'Febrero', 14, 3, 'Miércoles', FALSE, FALSE), -- San Valentín
('2024-03-15', 2024, 3, 1, 'Marzo', 15, 5, 'Viernes', FALSE, FALSE),
('2024-04-01', 2024, 4, 2, 'Abril', 1, 1, 'Lunes', FALSE, FALSE),
('2024-05-01', 2024, 5, 2, 'Mayo', 1, 3, 'Miércoles', FALSE, TRUE),  -- Día del Trabajo
('2024-06-15', 2024, 6, 2, 'Junio', 15, 6, 'Sábado', TRUE, FALSE),
('2024-07-20', 2024, 7, 3, 'Julio', 20, 6, 'Sábado', TRUE, TRUE),   -- Independencia
('2024-08-15', 2024, 8, 3, 'Agosto', 15, 4, 'Jueves', FALSE, FALSE),
('2024-09-10', 2024, 9, 3, 'Septiembre', 10, 2, 'Martes', FALSE, FALSE),
('2024-10-16', 2024, 10, 4, 'Octubre', 16, 3, 'Miércoles', FALSE, FALSE), -- Fecha actual
('2024-11-15', 2024, 11, 4, 'Noviembre', 15, 5, 'Viernes', FALSE, FALSE),
('2024-12-25', 2024, 12, 4, 'Diciembre', 25, 3, 'Miércoles', FALSE, TRUE), -- Navidad

-- Fechas de 2025
('2025-01-01', 2025, 1, 1, 'Enero', 1, 3, 'Miércoles', FALSE, TRUE), -- Año Nuevo
('2025-01-15', 2025, 1, 1, 'Enero', 15, 3, 'Miércoles', FALSE, FALSE),
('2025-02-14', 2025, 2, 1, 'Febrero', 14, 5, 'Viernes', FALSE, FALSE),
('2025-03-15', 2025, 3, 1, 'Marzo', 15, 6, 'Sábado', TRUE, FALSE),
('2025-04-01', 2025, 4, 2, 'Abril', 1, 2, 'Martes', FALSE, FALSE),
('2025-05-01', 2025, 5, 2, 'Mayo', 1, 4, 'Jueves', FALSE, TRUE),
('2025-06-15', 2025, 6, 2, 'Junio', 15, 7, 'Domingo', TRUE, FALSE),
('2025-07-20', 2025, 7, 3, 'Julio', 20, 7, 'Domingo', TRUE, TRUE),
('2025-08-15', 2025, 8, 3, 'Agosto', 15, 5, 'Viernes', FALSE, FALSE),
('2025-09-10', 2025, 9, 3, 'Septiembre', 10, 3, 'Miércoles', FALSE, FALSE),
('2025-10-16', 2025, 10, 4, 'Octubre', 16, 4, 'Jueves', FALSE, FALSE), -- Fecha actual
('2025-11-15', 2025, 11, 4, 'Noviembre', 15, 6, 'Sábado', TRUE, FALSE),
('2025-12-25', 2025, 12, 4, 'Diciembre', 25, 4, 'Jueves', FALSE, TRUE);

-- Verificar que se insertaron correctamente
SELECT 
    COUNT(*) as total_fechas,
    MIN(fecha) as fecha_inicio,
    MAX(fecha) as fecha_fin,
    COUNT(CASE WHEN es_fin_semana = TRUE THEN 1 END) as dias_fin_semana,
    COUNT(CASE WHEN es_festivo = TRUE THEN 1 END) as dias_festivos
FROM dim_tiempo;

-- Mostrar algunas fechas de muestra
SELECT * FROM dim_tiempo ORDER BY fecha LIMIT 10;

SELECT 'Dimensión tiempo poblada exitosamente' as status;