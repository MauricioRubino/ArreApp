import { CATEGORIES, MENU_ITEMS } from '../data/menuData'

// Capa de servicio: toda la app habla con la carta a través de estas
// funciones. Hoy resuelven contra datos locales con latencia simulada;
// el día que haya backend, sólo cambia lo de adentro de estas funciones.

const SIMULATED_LATENCY_MS = 350

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchCategories() {
  await delay(SIMULATED_LATENCY_MS)
  return CATEGORIES
}

export async function fetchMenuItems() {
  await delay(SIMULATED_LATENCY_MS)
  return MENU_ITEMS
}

export async function fetchMenuItemsByCategory(categoryId) {
  await delay(SIMULATED_LATENCY_MS)
  if (!categoryId || categoryId === 'todas') return MENU_ITEMS
  return MENU_ITEMS.filter((item) => item.categoryId === categoryId)
}

// Platos que el dueño marcó sin stock por WhatsApp (ver api/webhook.js).
// Sin backend disponible, no hay nada marcado sin stock.
export async function fetchOutOfStockIds() {
  try {
    const response = await fetch('/api/stock')
    if (!response.ok) return []
    const data = await response.json()
    return data.outOfStockIds ?? []
  } catch {
    return []
  }
}
