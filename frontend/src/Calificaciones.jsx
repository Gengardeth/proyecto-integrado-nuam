import { useEffect, useState, useContext } from 'react'
import { fetchCalificaciones, fetchContribuyentes, fetchParametros, createCalificacion, updateCalificacion, deleteCalificacion } from './api'
import { UserContext } from './App'

export default function Calificaciones() {
  const user = useContext(UserContext)
  const [calificaciones, setCalificaciones] = useState([])
  const [contribuyentes, setContribuyentes] = useState([])
  const [parametros, setParametros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // form state
  const [contribuyenteId, setContribuyenteId] = useState('')
  const [estadoId, setEstadoId] = useState('')
  const [puntaje, setPuntaje] = useState('')
  const [editingId, setEditingId] = useState(null)

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const [cals, conts, params] = await Promise.all([
        fetchCalificaciones(),
        fetchContribuyentes(),
        fetchParametros(),
      ])
      setCalificaciones(cals || [])
      setContribuyentes(conts || [])
      setParametros(params || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    try {
      const payload = {
        contribuyente_id: Number(contribuyenteId),
        estado_id: Number(estadoId),
        puntaje_total: puntaje,
      }
      if (editingId) {
        await updateCalificacion(editingId, payload)
        setEditingId(null)
      } else {
        await createCalificacion(payload)
      }
      setContribuyenteId('')
      setEstadoId('')
      setPuntaje('')
      await loadAll()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleEdit(item) {
    setEditingId(item.id)
    setContribuyenteId(item.contribuyente?.id || '')
    // estado comes as string; try to find matching parametro by name
    const estadoParam = parametros.find((p) => p.nombre === item.estado)
    setEstadoId(estadoParam ? estadoParam.id : '')
    setPuntaje(item.puntaje_total)
  }

  async function handleDelete(id) {
    setError(null)
    try {
      await deleteCalificacion(id)
      await loadAll()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Calificaciones</h2>
        {user && <small className="text-muted">Usuario: {user.username}</small>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <div className="text-muted">Cargando calificaciones...</div>}
      {!loading && (
        <>
          <form onSubmit={handleCreate} className="mb-4">
            <div className="row g-2">
              <div className="col-md-4">
                <label className="form-label">Contribuyente</label>
                <select value={contribuyenteId} onChange={(e) => setContribuyenteId(e.target.value)} required className="form-select">
                  <option value="">(seleccione)</option>
                  {contribuyentes.map((c) => (
                    <option value={c.id} key={c.id}>{c.rut} - {c.razon_social}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Estado</label>
                <select value={estadoId} onChange={(e) => setEstadoId(e.target.value)} required className="form-select">
                  <option value="">(seleccione)</option>
                  {parametros.map((p) => (
                    <option value={p.id} key={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Puntaje</label>
                <input value={puntaje} onChange={(e) => setPuntaje(e.target.value)} required className="form-control" />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div>
                  <button className="btn btn-success me-2" type="submit">{editingId ? 'Guardar' : 'Crear'}</button>
                  {editingId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setContribuyenteId(''); setEstadoId(''); setPuntaje('') }}>Cancelar</button>}
                </div>
              </div>
            </div>
          </form>

          <div>
            {calificaciones.length === 0 && <div className="text-muted">No hay calificaciones.</div>}
            <div className="row">
              {calificaciones.map((c) => (
                <div className="col-md-6" key={c.id}>
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">{c.contribuyente?.razon_social}</h5>
                      <p className="card-text">Estado: <strong>{c.estado}</strong></p>
                      <p className="card-text">Puntaje: <strong>{c.puntaje_total}</strong></p>
                      <div>
                        <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(c)}>Editar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
