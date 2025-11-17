import React, { useState, useEffect, useCallback } from 'react';
import bulkUploadsService from '../services/bulkUploads';
import ratingsService from '../services/ratings';
import '../styles/CargaMasiva.css';

const CargaMasiva = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  // Estadísticas reservadas para futuras mejoras de feedback post-procesamiento
  const [estadisticas, setEstadisticas] = useState(null); // eslint-disable-line no-unused-vars

  const fetchUploads = useCallback(async () => {
    try {
      setLoadingUploads(true);
      const resp = await bulkUploadsService.list({ page_size: 10 });
      setUploads(resp.data.results || resp.data);
    } catch (e) {
      console.error('Error listando cargas:', e);
    } finally {
      setLoadingUploads(false);
    }
  }, []);

  const fetchEstadisticas = useCallback(async () => {
    try {
      const resp = await ratingsService.estadisticas();
      setEstadisticas(resp.data);
    } catch (e) {
      console.error('Error obteniendo estadísticas de calificaciones:', e);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
    fetchEstadisticas();
  }, [fetchUploads, fetchEstadisticas]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Formato no válido. Solo CSV o Excel (.xlsx, .xls)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo supera 10MB');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResultado(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo primero');
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    setResultado(null);
    const formData = new FormData();
    formData.append('archivo', file);
    try {
      const response = await bulkUploadsService.upload(formData, (p) => setProgress(p));
      setProgress(100);
      setResultado(response.data);
      setFile(null);
      fetchUploads();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Error al subir');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setResultado(null);
    setError(null);
  };

  const handleProcesar = async (id) => {
    if (!window.confirm('¿Procesar esta carga?')) return;
    try {
      await bulkUploadsService.procesar(id);
      fetchUploads();
    } catch (err) {
      console.error('Error procesando carga:', err);
      alert('Error procesando carga');
    }
  };

  const handleVerItems = async (upload) => {
    setSelectedUpload(upload);
    setLoadingItems(true);
    try {
      const resp = await bulkUploadsService.items(upload.id);
      setItems(resp.data.results || resp.data);
    } catch (e) {
      console.error('Error cargando items:', e);
    } finally {
      setLoadingItems(false);
    }
  };

  return (
    <div className="carga-masiva-container">
      <div className="carga-header">
        <h1>Carga Masiva</h1>
        <p className="subtitle">Importa múltiples calificaciones desde CSV / Excel</p>
      </div>

      <div className="upload-card">
        <div
          className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <div className="drop-icon">📂</div>
              <h3>Arrastra tu archivo aquí</h3>
              <p>o</p>
              <label htmlFor="file-upload" className="file-upload-btn">
                Seleccionar archivo
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p className="file-hint">Formatos: CSV, XLSX • Máx 10MB</p>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <h3>{file.name}</h3>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              <button className="btn-remove" onClick={handleReset}>
                🗑️ Cambiar archivo
              </button>
            </>
          )}
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {uploading && (
          <div className="progress-container">
            <div className="progress-label">
              <span>Subiendo archivo...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {file && !resultado && (
          <div className="upload-actions">
            <button className="btn-secondary" onClick={handleReset} disabled={uploading}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Cargando...' : '⬆️ Cargar Archivo'}
            </button>
          </div>
        )}
      </div>

      {resultado && (
        <div className="result-card">
          <div className="result-header">
            <h2>✅ Carga Registrada</h2>
            <p className="mini-text">Estado: {resultado.estado}</p>
          </div>
          <div className="result-stats">
            <div className="stat-item total">
              <span className="stat-icon">∑</span>
              <div>
                <span className="stat-value">{resultado.total_filas}</span>
                <span className="stat-label">Total filas</span>
              </div>
            </div>
            <div className="stat-item success">
              <span className="stat-icon">✓</span>
              <div>
                <span className="stat-value">{resultado.filas_ok}</span>
                <span className="stat-label">Filas OK</span>
              </div>
            </div>
            <div className="stat-item error">
              <span className="stat-icon">✗</span>
              <div>
                <span className="stat-value">{resultado.filas_error}</span>
                <span className="stat-label">Filas Error</span>
              </div>
            </div>
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={handleReset}>📂 Nueva Carga</button>
          </div>
        </div>
      )}

      <div className="uploads-card">
        <div className="uploads-header">
          <h2>Cargas Recientes</h2>
          <button className="btn-refresh" onClick={fetchUploads} disabled={loadingUploads}>🔄</button>
        </div>
        <div className="table-responsive">
          <table className="uploads-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Archivo</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>OK</th>
                <th>Error</th>
                <th>% Éxito</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-row">No hay cargas registradas</td>
                </tr>
              )}
              {uploads.map((u) => (
                <tr key={u.id} className={u.estado.toLowerCase()}>
                  <td>{u.id}</td>
                  <td>{u.archivo?.split('/').pop() || '—'}</td>
                  <td>{u.tipo}</td>
                  <td>
                    <span className={`estado-badge estado-${u.estado.toLowerCase()}`}>{u.estado}</span>
                  </td>
                  <td>{u.filas_ok}</td>
                  <td>{u.filas_error}</td>
                  <td>{u.porcentaje_exito}%</td>
                  <td>{new Date(u.creado_en).toLocaleString()}</td>
                  <td className="row-actions">
                    <button
                      className="btn-mini"
                      onClick={() => handleVerItems(u)}
                      title="Ver items"
                    >
                      👁️
                    </button>
                    {u.estado === 'PENDIENTE' && (
                      <button
                        className="btn-mini btn-procesar"
                        onClick={() => handleProcesar(u.id)}
                        title="Procesar"
                      >
                        ⚙️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedUpload && (
          <div className="items-panel">
            <div className="items-header">
              <h3>Items de carga #{selectedUpload.id}</h3>
              <button
                className="btn-mini"
                onClick={() => {
                  setSelectedUpload(null);
                  setItems([]);
                }}
              >
                ✖
              </button>
            </div>
            {loadingItems ? (
              <p>Cargando items...</p>
            ) : items.length === 0 ? (
              <p className="mini-text">Sin items o aún no procesado.</p>
            ) : (
              <div className="items-list">
                {items.map((it) => (
                  <div key={it.id} className={`item-row item-${it.estado.toLowerCase()}`}>
                    <span className="item-num">#{it.numero_fila}</span>
                    <span className="item-estado">{it.estado}</span>
                    {it.mensaje_error && (
                      <span className="item-error">{it.mensaje_error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="instructions-card">
        <h2>📋 Instrucciones</h2>
        <div className="instructions-content">
          <h3>Formato del archivo</h3>
          <p>El archivo debe contener las siguientes columnas:</p>
          <ul>
            <li><strong>issuer_codigo</strong>: Código del issuer</li>
            <li><strong>instrument_nombre</strong>: Nombre del instrumento</li>
            <li><strong>rating</strong>: Calificación (ej: AAA, AA+, etc.)</li>
            <li><strong>fecha_emision</strong>: Fecha de emisión (YYYY-MM-DD)</li>
            <li><strong>fecha_vigencia</strong>: Fecha de vigencia (YYYY-MM-DD)</li>
            <li><strong>status</strong>: VIGENTE, VENCIDO o SUSPENDIDO</li>
          </ul>
          <h3>Ejemplo CSV</h3>
          <div className="code-block">
            issuer_codigo,instrument_nombre,rating,fecha_emision,fecha_vigencia,status<br/>
            ISS001,Bono Corporativo 2025,AAA,2025-01-15,2030-01-15,VIGENTE<br/>
            ISS002,Acción Preferente,AA+,2025-02-01,2028-02-01,VIGENTE
          </div>
          <h3>Notas importantes</h3>
          <ul>
            <li>Issuer e instrumento deben existir previamente</li>
            <li>Fechas en formato YYYY-MM-DD</li>
            <li>Valores de status: VIGENTE, VENCIDO, SUSPENDIDO</li>
            <li>Archivo máximo 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CargaMasiva;
