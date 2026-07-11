import { create } from 'zustand'

function makeCartItemId(menuItemId, guarnicion) {
  return guarnicion ? `${menuItemId}::${guarnicion}` : menuItemId
}

export const useCartStore = create((set) => ({
  items: [],

  addItem: (menuItem, { guarnicion } = {}) => {
    const cartItemId = makeCartItemId(menuItem.id, guarnicion)
    set((state) => {
      const existing = state.items.find((line) => line.cartItemId === cartItemId)
      if (existing) {
        return {
          items: state.items.map((line) =>
            line.cartItemId === cartItemId ? { ...line, quantity: line.quantity + 1 } : line
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            cartItemId,
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            guarnicion: guarnicion ?? null,
          },
        ],
      }
    })
  },

  setQuantity: (cartItemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((line) => line.cartItemId !== cartItemId) }
      }
      return {
        items: state.items.map((line) =>
          line.cartItemId === cartItemId ? { ...line, quantity } : line
        ),
      }
    })
  },

  removeItem: (cartItemId) => {
    set((state) => ({ items: state.items.filter((line) => line.cartItemId !== cartItemId) }))
  },

  clearCart: () => set({ items: [] }),
}))

export function selectTotalItems(state) {
  return state.items.reduce((sum, line) => sum + line.quantity, 0)
}

export function selectTotalPrice(state) {
  return state.items.reduce((sum, line) => sum + line.quantity * line.price, 0)
}
