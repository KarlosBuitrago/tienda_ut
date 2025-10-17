// Script para verificar conectividad con el backend
const testEndpoints = async () => {
  const baseURL = 'http://localhost:3006/api';
  
  console.log('🔍 Verificando conectividad del backend...');
  
  try {
    // Test endpoint de ventas
    console.log('\n1. Probando /api/ventas...');
    const ventasResponse = await fetch(`${baseURL}/ventas`);
    console.log('Status:', ventasResponse.status);
    const ventasData = await ventasResponse.json();
    console.log('Datos:', ventasData);
    
    // Test endpoint de estadísticas
    console.log('\n2. Probando /api/ventas/stats/resumen...');
    const statsResponse = await fetch(`${baseURL}/ventas/stats/resumen`);
    console.log('Status:', statsResponse.status);
    const statsData = await statsResponse.json();
    console.log('Datos:', statsData);
    
    // Test endpoint de clientes
    console.log('\n3. Probando /api/clientes...');
    const clientesResponse = await fetch(`${baseURL}/clientes`);
    console.log('Status:', clientesResponse.status);
    const clientesData = await clientesResponse.json();
    console.log('Total clientes:', clientesData.length);
    
    // Test endpoint de productos
    console.log('\n4. Probando /api/productos/disponibles...');
    const productosResponse = await fetch(`${baseURL}/productos/disponibles`);
    console.log('Status:', productosResponse.status);
    const productosData = await productosResponse.json();
    console.log('Total productos:', productosData.length);
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
};

// Ejecutar las pruebas
testEndpoints();