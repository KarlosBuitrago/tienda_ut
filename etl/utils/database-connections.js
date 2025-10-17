// ===============================================
// 🔌 GESTIÓN DE CONEXIONES A BASES DE DATOS
// ===============================================

const mysql = require('mysql2/promise');
require('dotenv').config();

class DatabaseConnections {
    constructor() {
        this.oltpConnection = null;
        this.dwConnection = null;
    }

    // 🔗 Conectar a la base de datos operacional (OLTP)
    async connectOLTP() {
        try {
            this.oltpConnection = await mysql.createConnection({
                host: process.env.OLTP_HOST,
                user: process.env.OLTP_USER,
                password: process.env.OLTP_PASSWORD,
                database: process.env.OLTP_DATABASE,
                timeout: parseInt(process.env.ETL_TIMEOUT) || 30000
            });
            console.log('✅ Conectado a base de datos OLTP:', process.env.OLTP_DATABASE);
            return this.oltpConnection;
        } catch (error) {
            console.error('❌ Error conectando a OLTP:', error.message);
            throw error;
        }
    }

    // 🏗️ Conectar al Data Warehouse (OLAP)
    async connectDW() {
        try {
            this.dwConnection = await mysql.createConnection({
                host: process.env.DW_HOST,
                user: process.env.DW_USER,
                password: process.env.DW_PASSWORD,
                database: process.env.DW_DATABASE,
                timeout: parseInt(process.env.ETL_TIMEOUT) || 30000
            });
            console.log('✅ Conectado a Data Warehouse:', process.env.DW_DATABASE);
            return this.dwConnection;
        } catch (error) {
            console.error('❌ Error conectando a DW:', error.message);
            throw error;
        }
    }

    // 🔌 Conectar a ambas bases de datos
    async connectAll() {
        await this.connectOLTP();
        await this.connectDW();
        return {
            oltp: this.oltpConnection,
            dw: this.dwConnection
        };
    }

    // 🧪 Probar conexiones
    async testConnections() {
        const results = {
            oltp: { status: 'disconnected', error: null },
            dw: { status: 'disconnected', error: null }
        };

        try {
            await this.connectOLTP();
            const [rows] = await this.oltpConnection.execute('SELECT COUNT(*) as count FROM producto');
            results.oltp = { 
                status: 'connected', 
                products: rows[0].count,
                database: process.env.OLTP_DATABASE
            };
        } catch (error) {
            results.oltp.error = error.message;
        }

        try {
            await this.connectDW();
            const [rows] = await this.dwConnection.execute('SELECT COUNT(*) as count FROM dim_tiempo');
            results.dw = { 
                status: 'connected', 
                time_records: rows[0].count,
                database: process.env.DW_DATABASE
            };
        } catch (error) {
            results.dw.error = error.message;
        }

        return results;
    }

    // 🚪 Cerrar conexiones
    async closeAll() {
        const promises = [];
        
        if (this.oltpConnection) {
            promises.push(this.oltpConnection.end());
            console.log('🚪 Cerrando conexión OLTP...');
        }
        
        if (this.dwConnection) {
            promises.push(this.dwConnection.end());
            console.log('🚪 Cerrando conexión DW...');
        }

        await Promise.all(promises);
        console.log('✅ Todas las conexiones cerradas');
    }

    // 📊 Obtener estadísticas de las bases de datos
    async getDatabaseStats() {
        const stats = {};

        try {
            // Estadísticas OLTP
            const [oltpTables] = await this.oltpConnection.execute(`
                SELECT 
                    table_name,
                    table_rows,
                    ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb
                FROM information_schema.tables 
                WHERE table_schema = ?
            `, [process.env.OLTP_DATABASE]);

            stats.oltp = oltpTables;

            // Estadísticas DW
            const [dwTables] = await this.dwConnection.execute(`
                SELECT 
                    table_name,
                    table_rows,
                    ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb
                FROM information_schema.tables 
                WHERE table_schema = ?
            `, [process.env.DW_DATABASE]);

            stats.dw = dwTables;

        } catch (error) {
            console.error('❌ Error obteniendo estadísticas:', error.message);
        }

        return stats;
    }
}

module.exports = DatabaseConnections;