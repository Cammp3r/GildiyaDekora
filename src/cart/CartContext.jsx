import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'

const CartContext = createContext(null)
const CART_STORAGE_KEY = 'gildiya-dekora-cart-v1'

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

function normalizeStoredItem(item) {
  if (!item || typeof item !== 'object' || !item.id) return null

  return {
    id: String(item.id),
    cartId: String(item.cartId ?? item.id),
    productId: String(item.productId ?? ''),
    variantId: String(item.variantId ?? 'default'),
    title: String(item.title ?? ''),
    image: String(item.image ?? ''),
    variantTitle: String(item.variantTitle ?? ''),
    volume: String(item.volume ?? ''),
    unitPrice: toNumber(item.unitPrice, null),
    priceCurrency: String(item.priceCurrency ?? 'UAH'),
    quantity: clampMin(toNumber(item.quantity, 1), 1),
    texture: item.texture ?? null,
    color: item.color ?? null,
  }
}

function loadStoredCart() {
  if (typeof window === 'undefined') return initialState

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return initialState

    const parsed = JSON.parse(raw)
    const items = Array.isArray(parsed?.items)
      ? parsed.items.map(normalizeStoredItem).filter(Boolean)
      : []

    return { items }
  } catch {
    return initialState
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, quantity, texture, color } = action.payload
      const nextQuantity = clampMin(toNumber(quantity, 1), 1)

      const itemId = `${item.id}:${item.variantId}:${texture || ''}:${color || ''}`
      const existingIndex = state.items.findIndex((x) => x.cartId === itemId)
      if (existingIndex === -1) {
        return {
          ...state,
          items: [...state.items, { ...item, cartId: itemId, quantity: nextQuantity, texture, color }],
        }
      }

      const existing = state.items[existingIndex]
      const merged = {
        ...existing,
        quantity: toNumber(existing.quantity, 0) + nextQuantity,
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

    case 'SET_QUANTITY': {
      const { id, quantity } = action.payload
      const nextQuantity = toNumber(quantity, 0)

      if (nextQuantity <= 0) {
        return {
          ...state,
          items: state.items.filter((x) => x.id !== id),
        }
      }

      return {
        ...state,
        items: state.items.map((x) =>
          x.id === id ? { ...x, quantity: clampMin(nextQuantity, 1) } : x
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
  const [state, dispatch] = useReducer(cartReducer, initialState, loadStoredCart)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: state.items }))
    } catch {
      // localStorage can be unavailable in private browsing or restricted environments.
    }
  }, [state.items])

  const api = useMemo(() => {
    const totalDistinctItems = state.items.length
    const totalQuantity = state.items.reduce(
      (sum, x) => sum + toNumber(x.quantity, 0),
      0
    )

    const totalPrice = state.items.reduce((sum, x) => {
      const unitPrice = toNumber(x.unitPrice, 0)
      const quantity = toNumber(x.quantity, 0)
      return sum + unitPrice * quantity
    }, 0)

    return {
      items: state.items,
      totalDistinctItems,
      totalQuantity,
      totalPrice,

      addItem: (product, variant = null, quantity = 1, texture = null, color = null) => {
        if (!product?.id) return
        const selectedVariant = variant ?? product.priceVariants?.[0] ?? null
        const variantId = selectedVariant?.id ?? selectedVariant?.volume ?? 'default'
        const unitPrice = toNumber(selectedVariant?.price ?? product.price, null)
        const volume = selectedVariant?.volume ?? ''

        dispatch({
          type: 'ADD_ITEM',
          payload: {
            item: {
              id: `${product.id}:${variantId}`,
              productId: String(product.id),
              variantId: String(variantId),
              title: product.title ?? '',
              image: product.image ?? '',
              // prefer an explicit variant title, fall back to type or volume if title is missing
              variantTitle: selectedVariant?.title ?? selectedVariant?.type ?? selectedVariant?.volume ?? '',
              volume,
              unitPrice,
              priceCurrency: 'UAH',
            },
            quantity,
            texture,
            color,
          },
        })
      },

      removeItem: (id) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { id: String(id) } })
      },

      setQuantity: (id, quantity) => {
        dispatch({ type: 'SET_QUANTITY', payload: { id: String(id), quantity } })
      },

      clear: () => dispatch({ type: 'CLEAR' }),
      clearCart: () => dispatch({ type: 'CLEAR' }),
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
