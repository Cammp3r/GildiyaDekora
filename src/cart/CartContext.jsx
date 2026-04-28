import { createContext, useContext, useMemo, useReducer } from 'react'

const CartContext = createContext(null)

const initialState = {
  items: [],
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : fallback
}

function clampMin(value, min) {
  return value < min ? min : value
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, areaM2 } = action.payload
      const nextArea = clampMin(toNumber(areaM2, 1), 0.1)

      const existingIndex = state.items.findIndex((x) => x.id === item.id)
      if (existingIndex === -1) {
        return {
          ...state,
          items: [...state.items, { ...item, areaM2: nextArea }],
        }
      }

      const existing = state.items[existingIndex]
      const merged = {
        ...existing,
        ...item,
        areaM2: toNumber(existing.areaM2, 0) + nextArea,
      }

      const nextItems = state.items.slice()
      nextItems[existingIndex] = merged
      return { ...state, items: nextItems }
    }

    case 'REMOVE_ITEM': {
      const { id } = action.payload
      return {
        ...state,
        items: state.items.filter((x) => x.id !== id),
      }
    }

    case 'SET_AREA': {
      const { id, areaM2 } = action.payload
      const nextArea = toNumber(areaM2, 0)

      if (nextArea <= 0) {
        return {
          ...state,
          items: state.items.filter((x) => x.id !== id),
        }
      }

      return {
        ...state,
        items: state.items.map((x) =>
          x.id === id ? { ...x, areaM2: clampMin(nextArea, 0.1) } : x
        ),
      }
    }

    case 'CLEAR':
      return initialState

    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const api = useMemo(() => {
    const totalDistinctItems = state.items.length
    const totalAreaM2 = state.items.reduce(
      (sum, x) => sum + toNumber(x.areaM2, 0),
      0
    )

    const totalPrice = state.items.reduce((sum, x) => {
      const pricePerM2 = toNumber(x.pricePerM2, 0)
      const areaM2 = toNumber(x.areaM2, 0)
      return sum + pricePerM2 * areaM2
    }, 0)

    return {
      items: state.items,
      totalDistinctItems,
      totalAreaM2,
      totalPrice,

      addItem: (product, areaM2 = 1) => {
        if (!product?.id) return
        dispatch({
          type: 'ADD_ITEM',
          payload: {
            item: {
              id: String(product.id),
              title: product.title ?? '',
              image: product.image ?? '',
              pricePerM2: toNumber(product.pricePerM2 ?? product.price, null),
            },
            areaM2,
          },
        })
      },

      removeItem: (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id: String(id) } })
      },

      setAreaM2: (id, areaM2) => {
        dispatch({ type: 'SET_AREA', payload: { id: String(id), areaM2 } })
      },

      clear: () => dispatch({ type: 'CLEAR' }),
    }
  }, [state.items])

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}
