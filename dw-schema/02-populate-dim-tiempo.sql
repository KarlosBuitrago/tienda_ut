-- ===============================================
-- 📅 POBLACIÓN DE LA DIMENSIÓN TIEMPO
-- Genera calendario completo para análisis temporal
-- ===============================================

USE tienda_cipa_dw;

-- Procedimiento para generar fechas automáticamente
DELIMITER //

CREATE PROCEDURE poblar_dim_tiempo(
    IN fecha_inicio DATE,
    IN fecha_fin DATE
)
BEGIN
    DECLARE fecha_actual DATE;
    DECLARE año_actual INT;
    DECLARE mes_actual INT;
    DECLARE dia_actual INT;
    DECLARE dia_semana_actual INT;
    DECLARE trimestre_actual INT;
    
    SET fecha_actual = fecha_inicio;
    
    -- Limpiar tabla si existe data previa
    DELETE FROM dim_tiempo WHERE fecha BETWEEN fecha_inicio AND fecha_fin;
    
    WHILE fecha_actual <= fecha_fin DO
        SET año_actual = YEAR(fecha_actual);
        SET mes_actual = MONTH(fecha_actual);
        SET dia_actual = DAY(fecha_actual);
        SET dia_semana_actual = WEEKDAY(fecha_actual) + 1; -- MySQL WEEKDAY: 0=Monday, ajustamos a 1=Monday
        SET trimestre_actual = QUARTER(fecha_actual);
        
        INSERT INTO dim_tiempo (
            fecha,
            año,
            mes,
            trimestre,
            mes_nombre,
            dia,
            dia_semana,
            dia_semana_nombre,
            es_fin_semana,
            es_festivo
        ) VALUES (
            fecha_actual,
            año_actual,
            mes_actual,
            trimestre_actual,
            CASE mes_actual
                WHEN 1 THEN 'Enero'
                WHEN 2 THEN 'Febrero'
                WHEN 3 THEN 'Marzo'
                WHEN 4 THEN 'Abril'
                WHEN 5 THEN 'Mayo'
                WHEN 6 THEN 'Junio'
                WHEN 7 THEN 'Julio'
                WHEN 8 THEN 'Agosto'
                WHEN 9 THEN 'Septiembre'
                WHEN 10 THEN 'Octubre'
                WHEN 11 THEN 'Noviembre'
                WHEN 12 THEN 'Diciembre'
            END,
            dia_actual,
            dia_semana_actual,
            CASE dia_semana_actual
                WHEN 1 THEN 'Lunes'
                WHEN 2 THEN 'Martes'
                WHEN 3 THEN 'Miércoles'
                WHEN 4 THEN 'Jueves'
                WHEN 5 THEN 'Viernes'
                WHEN 6 THEN 'Sábado'
                WHEN 7 THEN 'Domingo'
            END,
            CASE WHEN dia_semana_actual IN (6, 7) THEN TRUE ELSE FALSE END,
            -- Aquí puedes agregar lógica para días festivos específicos
            CASE 
                WHEN (mes_actual = 1 AND dia_actual = 1) THEN TRUE  -- Año Nuevo
                WHEN (mes_actual = 5 AND dia_actual = 1) THEN TRUE  -- Día del Trabajo
                WHEN (mes_actual = 7 AND dia_actual = 20) THEN TRUE -- Día de la Independencia
                WHEN (mes_actual = 12 AND dia_actual = 25) THEN TRUE -- Navidad
                ELSE FALSE
            END
        );
        
        SET fecha_actual = DATE_ADD(fecha_actual, INTERVAL 1 DAY);
    END WHILE;
    
END //

DELIMITER ;

-- Generar calendario desde 2020 hasta 2030 (rango amplio para análisis)
CALL poblar_dim_tiempo('2020-01-01', '2030-12-31');

-- Verificar que se crearon los registros
SELECT 
    COUNT(*) as total_dias,
    MIN(fecha) as fecha_inicio,
    MAX(fecha) as fecha_fin,
    COUNT(CASE WHEN es_fin_semana = TRUE THEN 1 END) as dias_fin_semana,
    COUNT(CASE WHEN es_festivo = TRUE THEN 1 END) as dias_festivos
FROM dim_tiempo;

-- Mostrar muestra de los primeros registros
SELECT * FROM dim_tiempo ORDER BY fecha LIMIT 10;

-- ===============================================
-- 📊 CONSULTAS DE EJEMPLO PARA VALIDACIÓN
-- ===============================================

-- Distribución por días de la semana
SELECT 
    dia_semana_nombre,
    COUNT(*) as cantidad_dias
FROM dim_tiempo 
GROUP BY dia_semana, dia_semana_nombre 
ORDER BY dia_semana;

-- Distribución por meses
SELECT 
    mes_nombre,
    COUNT(*) as cantidad_dias
FROM dim_tiempo 
GROUP BY mes, mes_nombre 
ORDER BY mes;

-- Años disponibles
SELECT 
    año,
    COUNT(*) as dias_en_año
FROM dim_tiempo 
GROUP BY año 
ORDER BY año;