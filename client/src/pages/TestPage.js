import React, { useEffect, useState } from 'react';
import { clientesService, productosVentaService, mediosPagoService } from '../services/ventasService';

const TestPage = () => {
  const [status, setStatus] = useState({
    clientes: 'cargando...',
    productos: 'cargando...',
    mediosPago: 'cargando...'
  });

  useEffect(() => {
    const testServices = async () => {
      // Test clientes
      try {
        const clientes = await clientesService.getAll();
        setStatus(prev => ({...prev, clientes: `✅ ${clientes.length} clientes`}));
      } catch (error) {
        setStatus(prev => ({...prev, clientes: `❌ Error: ${error.message}`}));
      }

      // Test productos
      try {
        const productos = await productosVentaService.getAvailable();
        setStatus(prev => ({...prev, productos: `✅ ${productos.length} productos`}));
      } catch (error) {
        setStatus(prev => ({...prev, productos: `❌ Error: ${error.message}`}));
      }

      // Test medios de pago
      try {
        const mediosPago = await mediosPagoService.getAll();
        setStatus(prev => ({...prev, mediosPago: `✅ ${mediosPago.length} medios de pago`}));
      } catch (error) {
        setStatus(prev => ({...prev, mediosPago: `❌ Error: ${error.message}`}));
      }
    };

    testServices();
  }, []);

  return (
    <div style={{padding: '2rem'}}>
      <h1>🔍 Test de Servicios</h1>
      <div style={{margin: '2rem 0'}}>
        <h3>Estado de los servicios:</h3>
        <ul>
          <li><strong>Clientes:</strong> {status.clientes}</li>
          <li><strong>Productos:</strong> {status.productos}</li>
          <li><strong>Medios de Pago:</strong> {status.mediosPago}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestPage;