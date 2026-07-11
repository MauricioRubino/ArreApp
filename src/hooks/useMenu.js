import { useEffect, useMemo, useState } from 'react'
import { fetchCategories, fetchMenuItems } from '../services/menuService'

export function useMenu() {
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('todas')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const [categoriesData, itemsData] = await Promise.all([
          fetchCategories(),
          fetchMenuItems(),
        ])
        if (!cancelled) {
          setCategories(categoriesData)
          setItems(itemsData)
        }
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'todas') return items
    return items.filter((item) => item.categoryId === selectedCategory)
  }, [items, selectedCategory])

  const groupedByCategory = useMemo(() => {
    if (selectedCategory !== 'todas') return null
    return categories
      .map((cat) => ({
        category: cat,
        items: items.filter((item) => item.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [items, categories, selectedCategory])

  const activeCategoryNote = useMemo(() => {
    if (selectedCategory === 'todas') return null
    return categories.find((cat) => cat.id === selectedCategory)?.note ?? null
  }, [categories, selectedCategory])

  return {
    categories,
    items: filteredItems,
    groupedByCategory,
    activeCategoryNote,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    error,
  }
}
