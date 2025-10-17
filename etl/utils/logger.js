// ===============================================
// 📝 SISTEMA DE LOGGING PARA ETL
// ===============================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Crear directorio de logs si no existe
const logDir = process.env.LOG_DIRECTORY || './logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Configuración de formatos
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
    })
);

// Crear logger principal
const logger = winston.createLogger({
    level: process.env.ETL_LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Archivo para todos los logs
        new winston.transports.File({
            filename: path.join(logDir, 'etl-combined.log'),
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 7
        }),
        
        // Archivo solo para errores
        new winston.transports.File({
            filename: path.join(logDir, 'etl-errors.log'),
            level: 'error',
            maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760,
            maxFiles: parseInt(process.env.LOG_MAX_FILES) || 7
        }),

        // Consola para desarrollo
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

class ETLLogger {
    constructor(processName = 'ETL') {
        this.processName = processName;
        this.startTime = null;
        this.stats = {
            extracted: 0,
            transformed: 0,
            loaded: 0,
            errors: 0,
            skipped: 0
        };
    }

    // 🚀 Iniciar proceso
    startProcess(description = '') {
        this.startTime = new Date();
        logger.info(`🚀 [${this.processName}] Iniciando proceso${description ? ': ' + description : ''}`);
        return this.startTime;
    }

    // ✅ Finalizar proceso
    endProcess(success = true) {
        const endTime = new Date();
        const duration = endTime - this.startTime;
        const durationStr = this.formatDuration(duration);
        
        const message = `${success ? '✅' : '❌'} [${this.processName}] Proceso ${success ? 'completado' : 'fallido'} en ${durationStr}`;
        
        if (success) {
            logger.info(message);
            this.logStats();
        } else {
            logger.error(message);
        }
        
        return { duration, stats: this.stats };
    }

    // 📊 Log estadísticas
    logStats() {
        logger.info(`📊 [${this.processName}] Estadísticas: Extraídos: ${this.stats.extracted}, Transformados: ${this.stats.transformed}, Cargados: ${this.stats.loaded}, Errores: ${this.stats.errors}, Omitidos: ${this.stats.skipped}`);
    }

    // 📈 Incrementar contadores
    incrementExtracted(count = 1) { this.stats.extracted += count; }
    incrementTransformed(count = 1) { this.stats.transformed += count; }
    incrementLoaded(count = 1) { this.stats.loaded += count; }
    incrementErrors(count = 1) { this.stats.errors += count; }
    incrementSkipped(count = 1) { this.stats.skipped += count; }

    // 📝 Métodos de logging
    info(message) {
        logger.info(`[${this.processName}] ${message}`);
    }

    warn(message) {
        logger.warn(`[${this.processName}] ${message}`);
    }

    error(message, error = null) {
        if (error) {
            logger.error(`[${this.processName}] ${message}`, error);
        } else {
            logger.error(`[${this.processName}] ${message}`);
        }
        this.incrementErrors();
    }

    debug(message) {
        logger.debug(`[${this.processName}] ${message}`);
    }

    // 🔄 Log progreso por lotes
    logProgress(current, total, operation = 'procesando') {
        const percentage = ((current / total) * 100).toFixed(1);
        this.info(`📈 ${operation}: ${current}/${total} (${percentage}%)`);
    }

    // ⏱️ Formatear duración
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // 📧 Enviar alerta (placeholder para futuras implementaciones)
    async sendAlert(level, message, details = null) {
        if (process.env.EMAIL_ALERTS_ENABLED === 'true') {
            // TODO: Implementar envío de emails
            this.warn(`🚨 Alerta ${level}: ${message}`);
        }
    }
}

// Función helper para crear logger específico
function createETLLogger(processName) {
    return new ETLLogger(processName);
}

module.exports = {
    logger,
    ETLLogger,
    createETLLogger
};