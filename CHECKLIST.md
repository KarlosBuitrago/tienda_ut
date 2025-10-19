# ✅ CHECKLIST: Migración de Reportes al DW

## 📋 Pre-requisitos

- [ ] MySQL instalado y corriendo
- [ ] Bases de datos creadas:
  - [ ] `tienda_cipa` (OLTP)
  - [ ] `tienda_cipa_dw` (DW)
- [ ] Node.js y npm instalados
- [ ] Dependencias instaladas (`npm install`)

---

## 🔧 Configuración

### 1. Archivo .env
- [ ] Copiar `.env.example` a `.env`
- [ ] Configurar `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- [ ] Configurar `DW_HOST`, `DW_USER`, `DW_PASSWORD`
- [ ] Verificar `DB_NAME=tienda_cipa`
- [ ] Verificar `DW_NAME=tienda_cipa_dw`

**Ejemplo:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=tienda_cipa

DW_HOST=localhost
DW_USER=root
DW_PASSWORD=tu_password
DW_NAME=tienda_cipa_dw
```

### 2. Crear Data Warehouse
```bash
# Desde la raíz del proyecto
mysql -u root -p < dw-schema/01-create-dw-database-clean.sql
mysql -u root -p < dw-schema/02-populate-dim-tiempo-simple.sql
```

- [ ] Script `01-create-dw-database-clean.sql` ejecutado
- [ ] Script `02-populate-dim-tiempo-simple.sql` ejecutado
- [ ] Verificar que existan las tablas:
  - [ ] `dim_tiempo`
  - [ ] `dim_producto`
  - [ ] `dim_cliente`
  - [ ] `dim_ubicacion`
  - [ ] `dim_medio_pago`
  - [ ] `fact_ventas`
  - [ ] `fact_ventas_diario`

---

## 🧪 Pruebas de Conexión

### Test 1: Probar conexión al DW
```bash
cd server
node test-dw-connection.js
```

**Resultado esperado:**
- [ ] ✅ Conectado al Data Warehouse (tienda_cipa_dw)
- [ ] ✅ Tablas encontradas (7 tablas)
- [ ] Registros contados en cada tabla

**Si falla:** Revisar `.env` y credenciales de MySQL

---

## 🔄 Cargar Datos con ETL

### Ejecutar ETL Completo
```bash
cd etl
npm run etl:full
```

**Verificar:**
- [ ] ✅ ETL de dimensiones completado
  - [ ] Productos cargados
  - [ ] Clientes cargados
  - [ ] Ubicaciones cargadas
  - [ ] Medios de pago cargados
- [ ] ✅ ETL de hechos completado
  - [ ] Ventas cargadas en `fact_ventas`
- [ ] ✅ Estadísticas agregadas actualizadas
  - [ ] `fact_ventas_diario` poblado

**Si hay errores:**
- Verificar que `tienda_cipa` tenga datos
- Revisar configuración de conexiones en `etl/utils/database-connections.js`

---

## 🚀 Iniciar Servidor

```bash
cd server
npm start
```

**Verificar logs:**
- [ ] ✅ Connected to the database
- [ ] ✅ Conectado al Data Warehouse (tienda_cipa_dw)
- [ ] Server running on port 3006

**Si no aparece el mensaje del DW:**
- Revisar `.env`
- Verificar que `tienda_cipa_dw` exista

---

## 🧪 Probar Endpoints

### Test 2: Dashboard
```bash
curl http://localhost:3006/api/reportes/dashboard
```

**Verificar respuesta:**
- [ ] `ventasTotal` > 0
- [ ] `utilidadTotal` presente (NUEVO)
- [ ] `margenPromedio` presente (NUEVO)
- [ ] Sin errores 500

### Test 3: Top Clientes
```bash
curl "http://localhost:3006/api/reportes/top-clientes?limite=5"
```

**Verificar respuesta:**
- [ ] Array `clientes` con datos
- [ ] Campo `segmento_cliente` presente (NUEVO)
- [ ] Campo `utilidad_generada` presente (NUEVO)

### Test 4: Stock Bajo
```bash
curl "http://localhost:3006/api/reportes/stock-bajo?minimo=10"
```

**Verificar respuesta:**
- [ ] Array `productos` con datos
- [ ] Campo `categoria_stock` presente (NUEVO)
- [ ] Campo `margen_porcentaje` presente (NUEVO)

### Test 5: Tendencias Mensuales
```bash
curl "http://localhost:3006/api/reportes/tendencias-ventas?periodo=mensual"
```

**Verificar respuesta:**
- [ ] Array `tendencias` con datos
- [ ] Campo `utilidad_total` presente (NUEVO)
- [ ] Campo `clientes_unicos` presente (NUEVO)

---

## 🔍 Verificar Logs del Servidor

Al hacer requests, deberías ver en la consola del servidor:

```
📊 [DW] Generando dashboard general...
✅ [DW] Dashboard generado exitosamente
```

- [ ] Logs con prefijo `[DW]` aparecen
- [ ] No hay errores de conexión
- [ ] No hay errores de SQL

---

## 🎯 Verificación Final

### Checklist de Funcionalidad

- [ ] **Dashboard** muestra datos correctos
- [ ] **Stock Bajo** filtra productos correctamente
- [ ] **Top Clientes** ordena por ventas
- [ ] **Top Productos** muestra más vendidos
- [ ] **Ventas por Municipio** agrupa geográficamente
- [ ] **Tendencias** calcula crecimiento
- [ ] **Rentabilidad** muestra márgenes
- [ ] **Clientes Inactivos** detecta inactividad

### Performance

- [ ] Reportes responden en < 1 segundo
- [ ] Consultas complejas son rápidas
- [ ] No hay delay notable vs versión anterior

### Compatibilidad

- [ ] Frontend sigue funcionando sin cambios
- [ ] Estructura de respuesta compatible
- [ ] No hay errores en consola del navegador

---

## 🐛 Troubleshooting

### ❌ Error: "Cannot connect to DW"
**Solución:**
1. Verificar `.env` tiene variables `DW_*`
2. Verificar MySQL corriendo: `mysql -u root -p`
3. Verificar que `tienda_cipa_dw` exista: `SHOW DATABASES;`

### ❌ Error: "Table doesn't exist"
**Solución:**
1. Ejecutar scripts de creación del DW
2. Verificar tablas: `USE tienda_cipa_dw; SHOW TABLES;`

### ❌ Reportes vacíos (arrays vacíos)
**Solución:**
1. Ejecutar ETL: `cd etl && npm run etl:full`
2. Verificar datos en OLTP: `SELECT COUNT(*) FROM tienda_cipa.venta;`
3. Verificar datos en DW: `SELECT COUNT(*) FROM tienda_cipa_dw.fact_ventas;`

### ❌ Error 500 en reportes
**Solución:**
1. Revisar logs del servidor
2. Verificar que ambas conexiones (OLTP y DW) funcionen
3. Probar conexión: `node test-dw-connection.js`

---

## 📊 Datos de Prueba (Opcional)

Si necesitas datos de prueba:

```sql
-- Insertar venta de prueba en OLTP
USE tienda_cipa;
INSERT INTO venta (fecha_venta, tipo_venta, total_venta, id_cliente)
VALUES (NOW(), 'efectivo', 150.00, 1);

-- Ejecutar ETL para llevar al DW
-- cd etl && npm run etl:facts
```

---

## ✨ Resultado Final

Si todo está ✅:

```
🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE!

✅ Conexiones funcionando (OLTP + DW)
✅ ETL ejecutado correctamente
✅ Reportes consultando DW
✅ Performance mejorado
✅ Métricas avanzadas disponibles
✅ Frontend compatible
```

---

## 📚 Documentación

- **Guía completa:** `MIGRATION_TO_DW.md`
- **Resumen visual:** `MIGRATION_SUMMARY.md`
- **Este checklist:** `CHECKLIST.md`

---

## 🔄 Mantenimiento Regular

### Diario/Semanal
- [ ] Ejecutar ETL incremental: `npm run etl:facts`
- [ ] Verificar logs del servidor
- [ ] Monitorear performance de reportes

### Mensual
- [ ] Ejecutar ETL completo: `npm run etl:full`
- [ ] Revisar tamaño de BD
- [ ] Optimizar índices si es necesario

---

**✅ Checklist completado = Sistema BI operacional al 100%**
