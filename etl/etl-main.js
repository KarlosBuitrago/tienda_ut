// ===============================================
// 🎯 ORCHESTRADOR PRINCIPAL DEL ETL
// Coordina los procesos de Extract, Transform y Load
// ===============================================

const DataExtractor = require('./extract');
const DataTransformer = require('./transform');
const DataLoader = require('./load');
const DatabaseConnections = require('./utils/database-connections');
const { createETLLogger } = require('./utils/logger');

class ETLOrchestrator {
    constructor() {
        this.logger = createETLLogger('ETL-MAIN');
        this.extractor = new DataExtractor();
        this.transformer = new DataTransformer();
        this.loader = new DataLoader();
        this.db = new DatabaseConnections();
    }

    // 🚀 Ejecutar ETL completo
    async runFullETL(options = {}) {
        const startTime = this.logger.startProcess('ETL Completo');
        
        try {
            this.logger.info('🎯 Iniciando proceso ETL completo...');
            
            // 1️⃣ Verificar conexiones
            await this.checkConnections();
            
            // 2️⃣ Ejecutar ETL de dimensiones
            if (options.loadDimensions !== false) {
                await this.runDimensionsETL();
            }
            
            // 3️⃣ Ejecutar ETL de hechos
            if (options.loadFacts !== false) {
                await this.runFactsETL(options);
            }
            
            // 4️⃣ Actualizar estadísticas agregadas
            if (options.updateStats !== false) {
                await this.updateAggregatedStats();
            }
            
            // 5️⃣ Generar reporte final
            const report = await this.generateETLReport();
            
            this.logger.endProcess(true);
            this.logger.info('🎉 ETL completo finalizado exitosamente');
            
            return report;
        } catch (error) {
            this.logger.error('Error en ETL completo', error);
            this.logger.endProcess(false);
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    // 🔍 ETL solo de dimensiones
    async runDimensionsETL() {
        this.logger.info('🔍 Ejecutando ETL de dimensiones...');
        
        try {
            await this.extractor.initialize();
            await this.loader.initialize();

            const results = {};

            // 🛍️ Productos
            this.logger.info('📦 Procesando dimensión productos...');
            const rawProducts = await this.extractor.extractProducts();
            const transformedProducts = this.transformer.transformProducts(rawProducts);
            results.products = await this.loader.loadProducts(transformedProducts);

            // 👥 Clientes
            this.logger.info('👥 Procesando dimensión clientes...');
            const rawClients = await this.extractor.extractClients();
            const transformedClients = this.transformer.transformClients(rawClients);
            results.clients = await this.loader.loadClients(transformedClients);

            // 🌍 Ubicaciones
            this.logger.info('🌍 Procesando dimensión ubicaciones...');
            const rawLocations = await this.extractor.extractLocations();
            const transformedLocations = this.transformer.transformLocations(rawLocations);
            results.locations = await this.loader.loadLocations(transformedLocations);

            // 💳 Medios de pago
            this.logger.info('💳 Procesando dimensión medios de pago...');
            const rawPaymentMethods = await this.extractor.extractPaymentMethods();
            const transformedPaymentMethods = this.transformer.transformPaymentMethods(rawPaymentMethods);
            results.paymentMethods = await this.loader.loadPaymentMethods(transformedPaymentMethods);

            this.logger.info('✅ ETL de dimensiones completado');
            return results;
        } catch (error) {
            this.logger.error('Error en ETL de dimensiones', error);
            throw error;
        }
    }

    // 📈 ETL solo de hechos
    async runFactsETL(options = {}) {
        this.logger.info('📈 Ejecutando ETL de hechos...');
        
        try {
            await this.extractor.initialize();
            await this.loader.initialize();

            const batchSize = options.batchSize || 1000;
            let totalProcessed = 0;
            let offset = 0;
            let hasMoreData = true;

            const results = {
                totalSales: 0,
                loaded: 0,
                skipped: 0,
                batches: 0
            };

            // Si se especifica rango de fechas, usar extracción por fechas
            if (options.startDate && options.endDate) {
                this.logger.info(`📅 Procesando ventas del ${options.startDate} al ${options.endDate}`);
                const rawSales = await this.extractor.extractSalesByDateRange(options.startDate, options.endDate);
                const transformedSales = this.transformer.transformSales(rawSales);
                const loadResults = await this.loader.loadSales(transformedSales);
                
                results.totalSales = rawSales.length;
                results.loaded = loadResults.loaded;
                results.skipped = loadResults.skipped;
                results.batches = 1;
            } else {
                // Procesamiento por lotes
                const totalSales = await this.extractor.getTotalSalesCount();
                results.totalSales = totalSales;

                this.logger.info(`📊 Total de ventas a procesar: ${totalSales}`);

                while (hasMoreData) {
                    this.logger.info(`🔄 Procesando lote ${results.batches + 1} (${offset} - ${offset + batchSize})...`);
                    
                    const rawSales = await this.extractor.extractSales(batchSize, offset);
                    
                    if (rawSales.length === 0) {
                        hasMoreData = false;
                        break;
                    }

                    const transformedSales = this.transformer.transformSales(rawSales);
                    const loadResults = await this.loader.loadSales(transformedSales);
                    
                    results.loaded += loadResults.loaded;
                    results.skipped += loadResults.skipped;
                    results.batches++;
                    
                    totalProcessed += rawSales.length;
                    offset += batchSize;

                    this.logger.logProgress(totalProcessed, totalSales, 'procesando ventas');

                    // Si el lote es menor que batchSize, ya no hay más datos
                    if (rawSales.length < batchSize) {
                        hasMoreData = false;
                    }
                }
            }

            // Actualizar estadísticas de clientes
            await this.loader.updateClientStatistics();

            this.logger.info('✅ ETL de hechos completado');
            return results;
        } catch (error) {
            this.logger.error('Error en ETL de hechos', error);
            throw error;
        }
    }

    // 📊 Actualizar estadísticas agregadas
    async updateAggregatedStats() {
        this.logger.info('📊 Actualizando estadísticas agregadas...');
        
        try {
            await this.db.connectDW();

            // Limpiar y recalcular fact_ventas_diario
            await this.db.dwConnection.execute('DELETE FROM fact_ventas_diario');

            const query = `
                INSERT INTO fact_ventas_diario (
                    tiempo_key, ubicacion_key, total_ventas, total_cantidad_productos,
                    total_utilidad, numero_transacciones, numero_clientes_unicos
                )
                SELECT 
                    fv.tiempo_key,
                    fv.ubicacion_key,
                    SUM(fv.total_linea) as total_ventas,
                    SUM(fv.cantidad_vendida) as total_cantidad_productos,
                    SUM(fv.utilidad_linea) as total_utilidad,
                    COUNT(DISTINCT fv.numero_venta_original) as numero_transacciones,
                    COUNT(DISTINCT fv.id_cliente_original) as numero_clientes_unicos
                FROM fact_ventas fv
                GROUP BY fv.tiempo_key, fv.ubicacion_key
            `;

            await this.db.dwConnection.execute(query);
            this.logger.info('✅ Estadísticas agregadas actualizadas');
        } catch (error) {
            this.logger.error('Error actualizando estadísticas agregadas', error);
            throw error;
        }
    }

    // 🧪 Verificar conexiones
    async checkConnections() {
        this.logger.info('🧪 Verificando conexiones...');
        
        const connectionTest = await this.db.testConnections();
        
        if (connectionTest.oltp.status !== 'connected') {
            throw new Error(`Error conectando a OLTP: ${connectionTest.oltp.error}`);
        }
        
        if (connectionTest.dw.status !== 'connected') {
            throw new Error(`Error conectando a DW: ${connectionTest.dw.error}`);
        }

        this.logger.info(`✅ OLTP: ${connectionTest.oltp.products} productos disponibles`);
        this.logger.info(`✅ DW: ${connectionTest.dw.time_records} fechas en dimensión tiempo`);
    }

    // 📋 Generar reporte del ETL
    async generateETLReport() {
        this.logger.info('📋 Generando reporte final...');
        
        try {
            await this.db.connectDW();

            const [dimensionCounts] = await this.db.dwConnection.execute(`
                SELECT 
                    'dim_producto' as tabla,
                    COUNT(*) as registros
                FROM dim_producto
                UNION ALL
                SELECT 'dim_cliente', COUNT(*) FROM dim_cliente
                UNION ALL
                SELECT 'dim_ubicacion', COUNT(*) FROM dim_ubicacion
                UNION ALL
                SELECT 'dim_medio_pago', COUNT(*) FROM dim_medio_pago
                UNION ALL
                SELECT 'fact_ventas', COUNT(*) FROM fact_ventas
                UNION ALL
                SELECT 'fact_ventas_diario', COUNT(*) FROM fact_ventas_diario
            `);

            const [salesStats] = await this.db.dwConnection.execute(`
                SELECT 
                    COUNT(DISTINCT numero_venta_original) as total_ventas,
                    COUNT(*) as total_lineas,
                    SUM(total_linea) as total_ingresos,
                    SUM(utilidad_linea) as total_utilidad,
                    AVG(margen_linea) as margen_promedio,
                    MIN(fecha_venta_original) as primera_venta,
                    MAX(fecha_venta_original) as ultima_venta
                FROM fact_ventas
            `);

            const report = {
                timestamp: new Date().toISOString(),
                tablas: dimensionCounts.reduce((acc, row) => {
                    acc[row.tabla] = row.registros;
                    return acc;
                }, {}),
                estadisticas_ventas: salesStats[0] || {},
                stats_etl: {
                    extracted: this.extractor.logger.stats.extracted,
                    transformed: this.transformer.logger.stats.transformed,
                    loaded: this.loader.logger.stats.loaded,
                    errors: this.extractor.logger.stats.errors + 
                           this.transformer.logger.stats.errors + 
                           this.loader.logger.stats.errors
                }
            };

            this.logger.info('📊 Reporte generado exitosamente');
            return report;
        } catch (error) {
            this.logger.error('Error generando reporte', error);
            return { error: error.message };
        }
    }

    // 🧹 Limpiar recursos
    async cleanup() {
        try {
            await this.extractor.finalize();
            await this.loader.finalize();
            await this.db.closeAll();
        } catch (error) {
            this.logger.error('Error en cleanup', error);
        }
    }

    // 📅 ETL incremental (solo nuevos datos)
    async runIncrementalETL(lastRunDate) {
        this.logger.info(`📅 Ejecutando ETL incremental desde ${lastRunDate}...`);
        
        const today = new Date().toISOString().split('T')[0];
        
        return await this.runFactsETL({
            startDate: lastRunDate,
            endDate: today,
            batchSize: 500
        });
    }
}

// 🎮 Función principal para ejecutar desde línea de comandos
async function main() {
    const args = process.argv.slice(2);
    const orchestrator = new ETLOrchestrator();
    
    try {
        if (args.includes('--full')) {
            console.log('🚀 Ejecutando ETL completo...');
            const report = await orchestrator.runFullETL();
            console.log('📊 Reporte final:', JSON.stringify(report, null, 2));
        } 
        else if (args.includes('--dimensions')) {
            console.log('🔍 Ejecutando ETL de dimensiones...');
            const results = await orchestrator.runDimensionsETL();
            console.log('📊 Resultados:', JSON.stringify(results, null, 2));
        } 
        else if (args.includes('--facts')) {
            console.log('📈 Ejecutando ETL de hechos...');
            const results = await orchestrator.runFactsETL();
            console.log('📊 Resultados:', JSON.stringify(results, null, 2));
        } 
        else if (args.includes('--test')) {
            console.log('🧪 Probando conexiones...');
            await orchestrator.checkConnections();
            console.log('✅ Conexiones OK');
        } 
        else {
            console.log(`
🎯 ETL Tienda CIPA - Uso:
  
  npm run etl:full        - ETL completo (dimensiones + hechos)
  npm run etl:dimensions  - Solo dimensiones
  npm run etl:facts       - Solo hechos de ventas
  npm run etl:test        - Probar conexiones
  
  Opciones directas:
  node etl-main.js --full
  node etl-main.js --dimensions
  node etl-main.js --facts
  node etl-main.js --test
            `);
        }
    } catch (error) {
        console.error('❌ Error en ETL:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = ETLOrchestrator;