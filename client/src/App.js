import React from "react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard/Dashboard';
import ProductosPageNew from './pages/Productos/ProductosPageNew';
import ClientesPage from './pages/Clientes/ClientesPage';
import VentasPage from './pages/Ventas/VentasPage';
import ReportesPage from './pages/Reportes/ReportesPage';
import TestPage from './pages/TestPage';
import "./App.css"; 

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<ProductosPageNew />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
