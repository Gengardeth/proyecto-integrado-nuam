import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuersAPI } from '../../services/api';
import '../../styles/SharedCRUD.css';

const IssuersList = () => {
  const navigate = useNavigate();
  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIssuers();
  }, []);

  const fetchIssuers = async () => {
    try {
      setLoading(true);
      const response = await issuersAPI.getAll();
      setIssuers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching issuers:', err);
      setError('Error al cargar los issuers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este issuer?')) return;
    
    try {
      await issuersAPI.delete(id);
      fetchIssuers();
    } catch (err) {
      console.error('Error deleting issuer:', err);
      alert('Error al eliminar el issuer');
    }
  };

  const filteredIssuers = issuers.filter(issuer =>
    issuer.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issuer.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>Issuers</h1>
        <button className="btn-primary" onClick={() => navigate('/emisores/nuevo')}>
          + Nuevo Issuer
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
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
              <th>Código</th>
              <th>Nombre</th>
              <th>RUT</th>
              {/* Sin campo país en el modelo actual */}
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssuers.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay issuers registrados'}
                </td>
              </tr>
            ) : (
              filteredIssuers.map((issuer) => (
                <tr key={issuer.id}>
                  <td><strong>{issuer.codigo}</strong></td>
                  <td>{issuer.nombre}</td>
                  <td>{issuer.rut}</td>
                  {/* <td>{issuer.pais}</td> */}
                  <td>
                    <span className={`status-badge ${issuer.activo ? 'status-active' : 'status-inactive'}`}>
                      {issuer.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => navigate(`/emisores/${issuer.id}/editar`)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => handleDelete(issuer.id)}
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

export default IssuersList;
