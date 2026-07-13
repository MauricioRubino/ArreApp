import { MENU_ITEMS } from '../../src/data/menuData.js'

const DIACRITICS_REGEX = new RegExp('[\\u0300-\\u036f]', 'g')

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(DIACRITICS_REGEX, '').trim()
}

// Devuelve los platos de la carta cuyo nombre contiene la búsqueda.
export function findMenuItemsByName(query) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return []
  return MENU_ITEMS.filter((item) => normalize(item.name).includes(normalizedQuery))
}

export function getMenuItemById(itemId) {
  return MENU_ITEMS.find((item) => item.id === itemId) || null
}
