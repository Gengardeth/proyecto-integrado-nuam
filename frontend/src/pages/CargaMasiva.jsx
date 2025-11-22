import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import bulkUploadsService from '../services/bulkUploads';
import ratingsService from '../services/ratings';
import api from '../services/httpClient';
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
  const [_itemsPage, setItemsPage] = useState(1); // eslint-disable-line no-unused-vars
  const [_itemsHasMore, setItemsHasMore] = useState(false); // eslint-disable-line no-unused-vars
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
      const response = await bulkUploadsService.procesar(id);
      // Actualizar la card de resultado si es la carga actual
      if (resultado && resultado.id === id) {
        setResultado(response.data);
      }
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

  const _handleEliminarCarga = async (upload) => {
    const confirmMsg = `¿Eliminar esta carga (#${upload.id})?\n\nArchivo: ${upload.archivo}\nTotal filas: ${upload.total_filas}\nEstado: ${upload.estado}\n\nEsta acción es irreversible.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/bulk-uploads/${upload.id}/`);
      fetchUploads();
    } catch (err) {
      console.error('Error eliminando carga:', err);
      alert('Error eliminando carga');
    }
  };

  const _handleVerItems = async (upload) => {
    setSelectedUpload(upload);
    setLoadingItems(true);
    try {
      // Cargar todos los items con page_size grande
      const resp = await api.get(`/bulk-uploads/${upload.id}/items/`, { 
        params: { page_size: 10000 } 
      });
      const allItems = resp.data.results || resp.data;
      setItems(Array.isArray(allItems) ? allItems : []);
    } catch (e) {
      console.error('Error cargando items:', e);
      setItems([]);
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
            <button 
              className="btn-primary" 
              onClick={async () => {
                await _handleProcesar(resultado.id);
              }}
              style={{ marginRight: '10px' }}
            >
              ▶️ Procesar Carga
            </button>
            <button 
              className="btn-secondary" 
              onClick={async () => {
                await _handleRechazar(resultado.id);
                setResultado(null);
              }}
              style={{ marginRight: '10px' }}
            >
              🗑️ Eliminar
            </button>
            <button className="btn-primary" onClick={handleReset}>📂 Nueva Carga</button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Cargas Recientes - visible para todos los usuarios */}
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
                  <th>Total Filas</th>
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
                    <td className="total-filas"><strong>{upload.total_filas}</strong></td>
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
                      {upload.estado === 'PENDIENTE' && isAdmin && (
                        <>
                          <button className="btn-mini" onClick={() => _handleProcesar(upload.id)} title="Procesar">▶️</button>
                          <button className="btn-mini btn-danger" onClick={() => _handleRechazar(upload.id)} title="Rechazar">✖️</button>
                        </>
                      )}
                      {isAdmin && (
                        <button className="btn-mini btn-danger" onClick={() => _handleEliminarCarga(upload)} title="Eliminar carga">🗑️</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {_selectedUpload && (
          <div className="items-modal-overlay">
            <div className="items-modal">
              <div className="items-header">
                <div>
                  <h3>Items de carga #{_selectedUpload.id}</h3>
                  <p className="items-count">Total: {_items.length} filas</p>
                </div>
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
                          <td className="item-message">{item.mensaje_error || '—'}</td>
                          <td className="item-data-full">{JSON.stringify(item.datos, null, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div className="instructions-card">
        <h2>📋 Instrucciones de Carga Masiva</h2>
        <div className="instructions-content">
          <h3>Formato del Archivo</h3>
          <ul className="instructions-list">
            <li><strong>Formatos soportados:</strong> Texto UTF-8 (.txt, .tsv). Tamaño máximo 10MB.</li>
            <li><strong>Delimitador:</strong> Tabulaciones (recomendado) o pipes <code>|</code></li>
            <li><strong>Primera línea:</strong> Headers (nombres de columnas)</li>
            <li><strong>Codificación:</strong> UTF-8 obligatorio</li>
          </ul>

          <h3>Estructura de Columnas</h3>
          <ul className="instructions-list">
            <li><strong>Requeridas:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li><code>issuer_codigo</code> - Código del emisor (debe existir en el sistema)</li>
                <li><code>instrument_codigo</code> - Código del instrumento (debe existir en el sistema)</li>
                <li><code>rating</code> - Calificación del rating</li>
                <li><code>valid_from</code> - Fecha de vigencia inicial (YYYY-MM-DD)</li>
              </ul>
            </li>
            <li><strong>Opcionales:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li><code>valid_to</code> - Fecha de fin de vigencia (YYYY-MM-DD, debe ser posterior a valid_from)</li>
                <li><code>status</code> - Estado de la calificación</li>
                <li><code>risk_level</code> - Nivel de riesgo</li>
                <li><code>comments</code> - Comentarios o notas</li>
              </ul>
            </li>
          </ul>

          <h3>Valores Válidos</h3>
          <ul className="instructions-list">
            <li><strong>Rating:</strong> AAA, AA, A, BBB, BB, B, CCC, CC, C, D</li>
            <li><strong>Status:</strong> VIGENTE, VENCIDO, SUSPENDIDO, CANCELADO</li>
            <li><strong>Risk Level:</strong> MUY_BAJO, BAJO, MODERADO, ALTO, MUY_ALTO</li>
          </ul>

          <h3>Flujo de Procesamiento</h3>
          <ol className="instructions-list">
            <li>Carga el archivo usando el área de arrastre o selecciona con el botón</li>
            <li>El archivo se registra en estado <strong>PENDIENTE</strong></li>
            <li>Presiona <strong>"Procesar Carga"</strong> para validar e insertar los registros</li>
            <li>Se valida cada fila: emisor, instrumento, rating, fechas y valores</li>
            <li>Filas válidas se insertan como registros; filas con errores se registran con su descripción de error</li>
            <li>Puedes revisar los detalles de cada carga en la tabla de \"Cargas Recientes\"</li>
          </ol>

          <h3>Validaciones y Restricciones</h3>
          <ul className="instructions-list">
            <li>Emisor e instrumento deben existir en el sistema previamente</li>
            <li>Campos requeridos no pueden estar vacíos</li>
            <li>Las fechas deben ser válidas en formato YYYY-MM-DD</li>
            <li>No puede haber duplicados de (issuer, instrument, valid_from) en la misma carga o en el sistema</li>
            <li>Si valid_to está presente, debe ser posterior a valid_from</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <footer className="carga-footer">
        <p>© {new Date().getFullYear()} NUAM | Sistema de Calificación Fiscal</p>
      </footer>
    </div>
  );
};

export default CargaMasiva;
