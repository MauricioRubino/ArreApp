// Única puerta de salida hacia el backend propio (/api/orders), que valida
// el pedido, lo guarda en Notion y dispara la automatización de n8n.
//
// Devuelve siempre uno de estos tres resultados, nunca lanza:
//   { status: 'created', numero }   → guardado; el número es el del día
//   { status: 'rejected', reason }  → el backend lo rechazó por una razón
//                                     concreta que se le puede explicar
//                                     al cliente (cerrado, fuera de zona…)
//   { status: 'failed' }            → no hay backend (vite dev) o no se
//                                     pudo guardar: el pedido NO existe
//
// Ojo con 'failed': no hay ningún canal de respaldo detrás. Si esto
// falla, el pedido no quedó en ningún lado y hay que decírselo al
// cliente en vez de mostrarle una confirmación.

const ENDPOINT = '/api/orders'

export async function submitToApi(type, payload) {
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      // Respuesta no-JSON (ej. el 404 html del dev server): backend ausente.
    }

    if (response.status === 409) {
      return { status: 'rejected', reason: data?.error ?? 'invalido' }
    }
    if (response.status === 429) {
      return { status: 'rejected', reason: 'rate-limited' }
    }
    if (response.status === 400) {
      return { status: 'rejected', reason: 'invalido' }
    }
    if (!response.ok || !data?.ok) {
      return { status: 'failed' }
    }

    return { status: 'created', numero: data.numero ?? null }
  } catch {
    console.warn('[apiClient] No se pudo contactar al backend.')
    return { status: 'failed' }
  }
}
