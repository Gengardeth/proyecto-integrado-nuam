import { useEffect, useState } from 'react'
import { fetchCalificaciones, fetchContribuyentes, fetchParametros, createCalificacion, updateCalificacion, deleteCalificacion } from './api'

export default function Calificaciones() {
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
      <h2>Calificaciones</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {loading && <div>Cargando calificaciones...</div>}
      {!loading && (
        <>
          <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
            <div>
              <label>Contribuyente</label>
              <select value={contribuyenteId} onChange={(e) => setContribuyenteId(e.target.value)} required>
                <option value="">(seleccione)</option>
                {contribuyentes.map((c) => (
                  <option value={c.id} key={c.id}>{c.rut} - {c.razon_social}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Estado (parámetro)</label>
              <select value={estadoId} onChange={(e) => setEstadoId(e.target.value)} required>
                <option value="">(seleccione)</option>
                {parametros.map((p) => (
                  <option value={p.id} key={p.id}>{p.nombre} ({p.tipo})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Puntaje</label>
              <input value={puntaje} onChange={(e) => setPuntaje(e.target.value)} required />
            </div>
            <div>
              <button type="submit">{editingId ? 'Guardar' : 'Crear'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setContribuyenteId(''); setEstadoId(''); setPuntaje('') }}>Cancelar</button>}
            </div>
          </form>

          <ul>
            {calificaciones.map((c) => (
              <li key={c.id} style={{ marginBottom: 8 }}>
                <strong>{c.contribuyente?.razon_social}</strong> — {c.estado} — {c.puntaje_total}
                <div>
                  <button onClick={() => handleEdit(c)}>Editar</button>
                  <button onClick={() => handleDelete(c.id)} style={{ marginLeft: 8 }}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
