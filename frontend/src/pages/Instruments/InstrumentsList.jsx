import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instrumentsAPI } from '../../services/api';
import '../../styles/SharedCRUD.css';

const InstrumentsList = () => {
  const navigate = useNavigate();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      const response = await instrumentsAPI.list();
      setInstruments(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching instruments:', err);
      setError('Error al cargar los instrumentos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este instrumento?')) return;
    
    try {
      await instrumentsAPI.delete(id);
      fetchInstruments();
    } catch (err) {
      console.error('Error deleting instrument:', err);
      alert('Error al eliminar el instrumento');
    }
  };

  const filteredInstruments = instruments.filter(inst =>
    inst.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h1>Instrumentos</h1>
        <button className="btn-primary" onClick={() => navigate('/instruments/nuevo')}>
          + Nuevo Instrumento
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o tipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Issuer</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstruments.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-state">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay instrumentos registrados'}
                </td>
              </tr>
            ) : (
              filteredInstruments.map((inst) => (
                <tr key={inst.id}>
                  <td><strong>{inst.nombre}</strong></td>
                  <td>
                    <span className="type-badge">{inst.tipo}</span>
                  </td>
                  <td>{inst.issuer_name || inst.issuer}</td>
                  <td>
                    <span className={`status-badge ${inst.activo ? 'status-active' : 'status-inactive'}`}>
                      {inst.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => navigate(`/instruments/${inst.id}/editar`)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(inst.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InstrumentsList;
