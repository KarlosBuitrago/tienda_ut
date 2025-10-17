// ===============================================
// 🔄 PROCESO DE TRANSFORMACIÓN (TRANSFORM)
// Limpia, valida y transforma los datos extraídos
// ===============================================

const { createETLLogger } = require('./utils/logger');

class DataTransformer {
    constructor() {
        this.logger = createETLLogger('TRANSFORM');
    }

    // 🛍️ Transformar datos de productos
    transformProducts(rawProducts) {
        this.logger.info(`🔄 Transformando ${rawProducts.length} productos...`);
        
        const transformedProducts = rawProducts.map(product => {
            try {
                // Calcular margen de utilidad
                const margin = product.precio_venta > 0 
                    ? ((product.precio_venta - product.costo) / product.precio_venta) * 100 
                    : 0;

                // Categorizar stock
                let stockCategory;
                if (product.stock === 0) stockCategory = 'Sin Stock';
                else if (product.stock <= 10) stockCategory = 'Bajo Stock';
                else if (product.stock <= 50) stockCategory = 'Stock Normal';
                else stockCategory = 'Alto Stock';

                const transformed = {
                    codigo_producto: product.codigo_producto,
                    nombre_producto: this.cleanText(product.nombre_producto),
                    tipo_producto: this.cleanText(product.nombre_tipo_producto),
                    unidad_medida: this.cleanText(product.nombre_unidad_medida),
                    precio_actual: parseFloat(product.precio_venta) || 0,
                    costo_actual: parseFloat(product.costo) || 0,
                    stock_actual: parseInt(product.stock) || 0,
                    margen_actual: Math.round(margin * 100) / 100, // Redondear a 2 decimales
                    categoria_stock: stockCategory
                };

                this.logger.incrementTransformed();
                return transformed;
            } catch (error) {
                this.logger.error(`Error transformando producto ${product.codigo_producto}`, error);
                this.logger.incrementErrors();
                return null;
            }
        }).filter(product => product !== null);

        this.logger.info(`✅ ${transformedProducts.length} productos transformados correctamente`);
        return transformedProducts;
    }

    // 👥 Transformar datos de clientes
    transformClients(rawClients) {
        this.logger.info(`🔄 Transformando ${rawClients.length} clientes...`);
        
        const transformedClients = rawClients.map(client => {
            try {
                // Calcular rango de edad
                let ageRange = 'No especificado';
                if (client.edad) {
                    const age = parseInt(client.edad);
                    if (age < 18) ageRange = 'Menor de 18';
                    else if (age >= 18 && age <= 25) ageRange = '18-25 años';
                    else if (age >= 26 && age <= 35) ageRange = '26-35 años';
                    else if (age >= 36 && age <= 50) ageRange = '36-50 años';
                    else if (age > 50) ageRange = 'Mayor de 50';
                }

                // Normalizar género
                let gender = 'No especificado';
                if (client.genero_cliente) {
                    const g = client.genero_cliente.toLowerCase();
                    if (g === 'femenino' || g === 'f') gender = 'Femenino';
                    else if (g === 'masculino' || g === 'm') gender = 'Masculino';
                }

                const transformed = {
                    id_cliente_original: client.id_cliente,
                    nombre_cliente: this.cleanText(client.nombre_cliente),
                    genero_cliente: gender,
                    tipo_documento: this.cleanText(client.nombre_tipo_documento),
                    numero_documento: this.cleanText(client.numero_documento),
                    municipio: this.cleanText(client.nombre_municipio),
                    edad: client.edad ? parseInt(client.edad) : null,
                    rango_edad: ageRange,
                    segmento_cliente: this.calculateClientSegment(client),
                    email: this.cleanEmail(client.email),
                    telefono_principal: this.cleanPhone(client.telefono_principal),
                    direccion: this.cleanText(client.direccion_cliente),
                    fecha_primer_compra: null, // Se calculará en el loader
                    fecha_ultima_compra: null, // Se calculará en el loader
                    total_compras_historico: 0, // Se calculará en el loader
                    numero_compras_historico: 0, // Se calculará en el loader
                    promedio_compra: 0 // Se calculará en el loader
                };

                this.logger.incrementTransformed();
                return transformed;
            } catch (error) {
                this.logger.error(`Error transformando cliente ${client.id_cliente}`, error);
                this.logger.incrementErrors();
                return null;
            }
        }).filter(client => client !== null);

        this.logger.info(`✅ ${transformedClients.length} clientes transformados correctamente`);
        return transformedClients;
    }

    // 🌍 Transformar datos de ubicaciones
    transformLocations(rawLocations) {
        this.logger.info(`🔄 Transformando ${rawLocations.length} ubicaciones...`);
        
        const transformedLocations = rawLocations.map(location => {
            try {
                const transformed = {
                    id_municipio_original: location.id_municipio,
                    nombre_municipio: this.cleanText(location.nombre_municipio),
                    departamento: this.cleanText(location.departamento),
                    region: this.cleanText(location.region),
                    zona: 'Urbana' // Por defecto, se puede expandir con más lógica
                };

                this.logger.incrementTransformed();
                return transformed;
            } catch (error) {
                this.logger.error(`Error transformando ubicación ${location.id_municipio}`, error);
                this.logger.incrementErrors();
                return null;
            }
        }).filter(location => location !== null);

        this.logger.info(`✅ ${transformedLocations.length} ubicaciones transformadas correctamente`);
        return transformedLocations;
    }

    // 💳 Transformar medios de pago
    transformPaymentMethods(rawPaymentMethods) {
        this.logger.info(`🔄 Transformando ${rawPaymentMethods.length} medios de pago...`);
        
        const transformedPaymentMethods = rawPaymentMethods.map(paymentMethod => {
            try {
                const transformed = {
                    id_medio_pago_original: paymentMethod.id_medio_pago,
                    nombre_medio_pago: this.cleanText(paymentMethod.nombre_medio_pago),
                    tipo_pago: paymentMethod.tipo_pago
                };

                this.logger.incrementTransformed();
                return transformed;
            } catch (error) {
                this.logger.error(`Error transformando medio de pago ${paymentMethod.id_medio_pago}`, error);
                this.logger.incrementErrors();
                return null;
            }
        }).filter(pm => pm !== null);

        this.logger.info(`✅ ${transformedPaymentMethods.length} medios de pago transformados correctamente`);
        return transformedPaymentMethods;
    }

    // 💰 Transformar datos de ventas
    transformSales(rawSales) {
        this.logger.info(`🔄 Transformando ${rawSales.length} registros de ventas...`);
        
        const transformedSales = rawSales.map(sale => {
            try {
                // Validar datos obligatorios
                if (!sale.numero_venta || !sale.codigo_producto || !sale.id_cliente) {
                    this.logger.warn(`Venta con datos faltantes: ${JSON.stringify(sale)}`);
                    this.logger.incrementSkipped();
                    return null;
                }

                // Calcular métricas
                const cantidadVendida = parseInt(sale.cantidad_vendida) || 1;
                const precioUnitario = parseFloat(sale.precio_unitario) || 0;
                const costoUnitario = parseFloat(sale.costo_unitario) || 0;
                const subtotal = parseFloat(sale.subtotal) || 0;
                const descuento = parseFloat(sale.descuento) || 0;
                const totalLinea = subtotal - descuento;
                const utilidadLinea = totalLinea - (costoUnitario * cantidadVendida);
                const margenLinea = totalLinea > 0 ? (utilidadLinea / totalLinea) * 100 : 0;

                const transformed = {
                    numero_venta_original: sale.numero_venta,
                    codigo_producto_original: sale.codigo_producto,
                    id_cliente_original: sale.id_cliente,
                    id_municipio_original: sale.id_municipio,
                    id_medio_pago_original: sale.id_medio_pago || null,
                    cantidad_vendida: cantidadVendida,
                    precio_unitario: precioUnitario,
                    costo_unitario: costoUnitario,
                    subtotal: subtotal,
                    descuento: descuento,
                    total_linea: Math.round(totalLinea * 100) / 100,
                    utilidad_linea: Math.round(utilidadLinea * 100) / 100,
                    margen_linea: Math.round(margenLinea * 100) / 100,
                    tipo_venta: this.cleanText(sale.tipo_venta) || 'Contado',
                    fecha_venta_original: sale.fecha_venta
                };

                this.logger.incrementTransformed();
                return transformed;
            } catch (error) {
                this.logger.error(`Error transformando venta ${sale.numero_venta}`, error);
                this.logger.incrementErrors();
                return null;
            }
        }).filter(sale => sale !== null);

        this.logger.info(`✅ ${transformedSales.length} ventas transformadas correctamente`);
        return transformedSales;
    }

    // 🧹 Funciones de limpieza y utilidades
    
    cleanText(text) {
        if (!text) return '';
        return text.toString().trim().replace(/\s+/g, ' ').substring(0, 255);
    }

    cleanEmail(email) {
        if (!email || typeof email !== 'string') return null;
        const cleaned = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(cleaned) ? cleaned : null;
    }

    cleanPhone(phone) {
        if (!phone) return null;
        // Remover caracteres no numéricos excepto +, (, ), -, espacios
        const cleaned = phone.toString().replace(/[^\d+\-\s()]/g, '');
        return cleaned.substring(0, 20);
    }

    calculateClientSegment(client) {
        // Lógica simple de segmentación
        // Se puede expandir con más criterios de negocio
        if (client.email && client.telefono_principal) {
            return 'Premium';
        } else if (client.email || client.telefono_principal) {
            return 'Activo';
        } else {
            return 'Regular';
        }
    }

    // 📊 Validar integridad de datos
    validateTransformedData(data, type) {
        this.logger.info(`🔍 Validando ${data.length} registros de ${type}...`);
        
        let validRecords = 0;
        let invalidRecords = 0;

        data.forEach((record, index) => {
            try {
                switch (type) {
                    case 'products':
                        if (!record.codigo_producto || !record.nombre_producto) {
                            throw new Error('Producto sin código o nombre');
                        }
                        break;
                    
                    case 'clients':
                        if (!record.id_cliente_original || !record.nombre_cliente) {
                            throw new Error('Cliente sin ID o nombre');
                        }
                        break;
                    
                    case 'sales':
                        if (!record.numero_venta_original || !record.codigo_producto_original) {
                            throw new Error('Venta sin número o producto');
                        }
                        break;
                }
                validRecords++;
            } catch (error) {
                this.logger.warn(`Registro inválido en ${type}[${index}]: ${error.message}`);
                invalidRecords++;
            }
        });

        this.logger.info(`✅ Validación completada: ${validRecords} válidos, ${invalidRecords} inválidos`);
        return { valid: validRecords, invalid: invalidRecords };
    }

    // 📈 Generar estadísticas de transformación
    generateTransformationStats() {
        return {
            extracted: this.logger.stats.extracted,
            transformed: this.logger.stats.transformed,
            errors: this.logger.stats.errors,
            skipped: this.logger.stats.skipped,
            successRate: this.logger.stats.extracted > 0 
                ? ((this.logger.stats.transformed / this.logger.stats.extracted) * 100).toFixed(2)
                : 0
        };
    }
}

module.exports = DataTransformer;