import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import bulkUploadsService from '../services/bulkUploads';
import ratingsService from '../services/ratings';
import '../styles/CargaMasiva.css';

const CargaMasiva = () => {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
    const [_uploads, setUploads] = useState([]);
    const [_loadingUploads, setLoadingUploads] = useState(false);
    const [_selectedUpload, setSelectedUpload] = useState(null);
  const [_items, setItems] = useState([]);
  const [_loadingItems, setLoadingItems] = useState(false);
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
    // Validar que sea archivo de texto UTF-8
    const validTypes = ['text/plain', 'text/tab-separated-values'];
    const validExtensions = /\.(txt|tsv)$/i;
    
    if (!validTypes.includes(selectedFile.type) && !validExtensions.test(selectedFile.name)) {
      setError('Formato no válido. Solo se aceptan archivos de texto UTF-8 (.txt, .tsv)');
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
      // Extraer mensaje útil del backend
      const data = err.response?.data;
      let msg = data?.detail || data?.error;
      if (!msg && data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstVal = data[firstKey];
        if (Array.isArray(firstVal)) msg = firstVal[0];
        else if (typeof firstVal === 'string') msg = firstVal;
      }
      setError(msg || 'Error al subir');
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

  const _handleProcesar = async (id) => {
    if (!window.confirm('¿Procesar esta carga?')) return;
    try {
      await bulkUploadsService.procesar(id);
      fetchUploads();
    } catch (err) {
      console.error('Error procesando carga:', err);
      alert('Error procesando carga');
    }
  };

  const _handleRechazar = async (id) => {
    if (!window.confirm('¿Rechazar esta carga? No se podrá procesar después.')) return;
    try {
      await bulkUploadsService.rechazar(id);
      fetchUploads();
    } catch (err) {
      console.error('Error rechazando carga:', err);
      alert('Error rechazando carga');
    }
  };

  const _handleVerItems = async (upload) => {
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

  // Animación fade-in para la pantalla de carga masiva
  const fadeInStyle = {
    animation: 'fadeIn 0.7s',
  };

  return (
    <div className="carga-masiva-container" style={fadeInStyle}>
      <div className="carga-header">
        <h1>Carga Masiva</h1>
        <p className="subtitle">Importa múltiples calificaciones desde archivos UTF-8 (TXT, TSV)</p>
      </div>

      {!isAdmin && (
        <div className="info-message" style={{ padding: '20px', backgroundColor: '#e3f2fd', border: '1px solid #2196F3', borderRadius: '4px', marginBottom: '20px' }}>
          <p>ℹ️ Solo los administradores pueden subir archivos. Aquí puedes ver el historial de cargas.</p>
        </div>
      )}

      {isAdmin && (
        <>
      {/* ...existing code... */}
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
                accept=".txt,.tsv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p className="file-hint">Formatos: TXT, TSV • Máx 10MB</p>
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
            <button className="btn-secondary" onClick={handleReset} disabled={uploading} style={uploading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleUpload} disabled={uploading} style={uploading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>
              {uploading ? 'Cargando...' : '⬆️ Cargar Archivo'}
            </button>
          </div>
        )}
      </div>

      {/* ...existing code... */}
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
            {resultado.estado === 'PENDIENTE' && (
              <button 
                className="btn-primary" 
                onClick={async () => {
                  await _handleProcesar(resultado.id);
                  setResultado(null);
                }}
                style={{ marginRight: '10px' }}
              >
                ▶️ Procesar Carga
              </button>
            )}
            <button className="btn-primary" onClick={handleReset}>📂 Nueva Carga</button>
          </div>
        </div>
      )}

      {/* ...existing code... */}
      <div className="uploads-card">
        <div className="uploads-header">
          <h2>Cargas Recientes</h2>
          <button className="btn-refresh" onClick={fetchUploads} disabled={_loadingUploads} style={_loadingUploads ? { opacity: 0.7, cursor: 'not-allowed' } : {}}>🔄</button>
        </div>
        {_uploads.length === 0 ? (
          <p className="no-data">No hay cargas registradas aún</p>
        ) : (
          <div className="table-responsive">
            <table className="uploads-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Archivo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Filas OK / Error</th>
                  <th>Éxito %</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {_uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td>#{upload.id}</td>
                    <td>{upload.archivo.split('/').pop()}</td>
                    <td>{upload.tipo}</td>
                    <td>
                      <span className={`badge badge-${upload.estado.toLowerCase()}`}>
                        {upload.estado}
                      </span>
                    </td>
                    <td>{upload.filas_ok} / {upload.filas_error}</td>
                    <td>{upload.porcentaje_exito}%</td>
                    <td>{new Date(upload.creado_en).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-mini" onClick={() => _handleVerItems(upload)} title="Ver detalles">👁️</button>
                      {upload.estado === 'PENDIENTE' && (
                        <>
                          <button className="btn-mini" onClick={() => _handleProcesar(upload.id)} title="Procesar">▶️</button>
                          <button className="btn-mini btn-danger" onClick={() => _handleRechazar(upload.id)} title="Rechazar">✖️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {_selectedUpload && (
          <div className="items-panel">
            <div className="items-header">
              <h3>Items de carga #{_selectedUpload.id}</h3>
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
            {_loadingItems ? (
              <p>Cargando items...</p>
            ) : _items.length === 0 ? (
              <p>No hay items para esta carga. Procésala primero.</p>
            ) : (
              <div className="items-table-container">
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Estado</th>
                      <th>Mensaje</th>
                      <th>Datos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {_items.map((item) => (
                      <tr key={item.id} className={`item-${item.estado.toLowerCase()}`}>
                        <td>{item.numero_fila}</td>
                        <td>
                          <span className={`badge badge-${item.estado.toLowerCase()}`}>
                            {item.estado}
                          </span>
                        </td>
                        <td>{item.mensaje_error || '—'}</td>
                        <td className="item-data">{JSON.stringify(item.datos).substring(0, 50)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ...existing code... */}
      <div className="instructions-card">
        <h2>📋 Instrucciones</h2>
        <div className="instructions-content">
          <ul className="instructions-list">
            <li>Formatos soportados: Texto UTF-8 (.txt, .tsv). Tamaño máx 10MB.</li>
            <li>Delimitador: Pipes <code>|</code> o tabulaciones. Primera línea debe ser headers.</li>
            <li>Encabezados requeridos: <code>issuer_codigo</code>, <code>instrument_codigo</code>, <code>rating</code>, <code>valid_from</code>.</li>
            <li>Campos opcionales: <code>valid_to</code>, <code>status</code>, <code>risk_level</code>, <code>comments</code>.</li>
            <li>Valores válidos:
              <br/>rating: AAA, AA, A, BBB, BB, B, CCC, CC, C, D
              <br/>status: VIGENTE, VENCIDO, SUSPENDIDO, CANCELADO
              <br/>risk_level: MUY_BAJO, BAJO, MODERADO, ALTO, MUY_ALTO
            </li>
            <li><code>valid_from</code> y <code>valid_to</code> usan formato YYYY-MM-DD. Si se indica <code>valid_to</code>, debe ser posterior.</li>
            <li>Los códigos de emisor e instrumento deben existir previamente en el sistema.</li>
          </ul>
          <p className="mini-text">Consulta la documentación del formato en <code>docs/UPLOAD_FORMAT.md</code> dentro del repositorio para ver ejemplos.</p>
        </div>
      </div>
        </>
      )}

      {/* Footer */}
      <footer className="carga-footer">
        <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
      </footer>
    </div>
  );
};

export default CargaMasiva;
