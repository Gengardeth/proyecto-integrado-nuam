import React, { useState } from 'react';
import { bulkUploadsAPI } from '../services/api';
import '../styles/CargaMasiva.css';

const CargaMasiva = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Formato de archivo no válido. Solo se permiten archivos CSV o Excel (.xlsx, .xls)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      setError('El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await bulkUploadsAPI.upload(formData);
      
      clearInterval(progressInterval);
      setProgress(100);
      setResult(response.data);
      setFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Error al cargar el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setProgress(0);
    setResult(null);
    setError(null);
  };

  return (
    <div className="carga-masiva-container">
      <div className="carga-header">
        <h1>Carga Masiva</h1>
        <p className="subtitle">Importa múltiples calificaciones desde un archivo CSV o Excel</p>
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
              <p className="file-hint">Formatos aceptados: CSV, Excel (.xlsx, .xls) • Máximo 10MB</p>
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

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {uploading && (
          <div className="progress-container">
            <div className="progress-label">
              <span>Procesando archivo...</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {file && !result && (
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

      {result && (
        <div className="result-card">
          <div className="result-header">
            <h2>✅ Carga Completada</h2>
          </div>

          <div className="result-stats">
            <div className="stat-item success">
              <span className="stat-icon">✓</span>
              <div>
                <span className="stat-value">{result.exitosos || 0}</span>
                <span className="stat-label">Exitosos</span>
              </div>
            </div>

            <div className="stat-item error">
              <span className="stat-icon">✗</span>
              <div>
                <span className="stat-value">{result.errores || 0}</span>
                <span className="stat-label">Errores</span>
              </div>
            </div>

            <div className="stat-item total">
              <span className="stat-icon">∑</span>
              <div>
                <span className="stat-value">{result.total || 0}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          </div>

          {result.detalles_errores && result.detalles_errores.length > 0 && (
            <div className="errors-section">
              <h3>Errores encontrados</h3>
              <div className="errors-list">
                {result.detalles_errores.map((err, index) => (
                  <div key={index} className="error-item">
                    <span className="error-row">Fila {err.fila || err.row || index + 1}</span>
                    <span className="error-detail">{err.error || err.mensaje || 'Error desconocido'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="btn-primary" onClick={handleReset}>
              📂 Cargar Otro Archivo
            </button>
          </div>
        </div>
      )}

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
            <li><strong>estado</strong>: VIGENTE, VENCIDO o SUSPENDIDO</li>
          </ul>

          <h3>Ejemplo CSV</h3>
          <div className="code-block">
            issuer_codigo,instrument_nombre,rating,fecha_emision,fecha_vigencia,estado<br/>
            ISS001,Bono Corporativo 2025,AAA,2025-01-15,2030-01-15,VIGENTE<br/>
            ISS002,Acción Preferente,AA+,2025-02-01,2028-02-01,VIGENTE
          </div>

          <h3>Notas importantes</h3>
          <ul>
            <li>El issuer y el instrumento deben existir previamente en el sistema</li>
            <li>Las fechas deben estar en formato YYYY-MM-DD</li>
            <li>Los valores de estado son: VIGENTE, VENCIDO, SUSPENDIDO</li>
            <li>El archivo no debe superar los 10MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CargaMasiva;
