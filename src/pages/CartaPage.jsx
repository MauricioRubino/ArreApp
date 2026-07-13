import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useMenu } from '../hooks/useMenu'
import { useCartStore } from '../store/cartStore'
import CategoryTabs from '../components/menu/CategoryTabs'
import MenuList from '../components/menu/MenuList'
import SectionHeading from '../components/menu/SectionHeading'
import GuarnicionPicker from '../components/menu/GuarnicionPicker'

export default function CartaPage() {
  const {
    categories,
    items,
    groupedByCategory,
    activeCategoryNote,
    selectedCategory,
    setSelectedCategory,
    isLoading,
  } = useMenu()

  const addItem = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)
  const hasCartItems = cartItems.length > 0
  const [pickerItem, setPickerItem] = useState(null)

  function handleAdd(item) {
    if (item.requiresGuarnicion) {
      setPickerItem(item)
    } else {
      addItem(item)
    }
  }

  function handleConfirmGuarnicion(guarnicion) {
    addItem(pickerItem, { guarnicion })
    setPickerItem(null)
  }

  const activeLabel =
    selectedCategory === 'todas'
      ? null
      : categories.find((cat) => cat.id === selectedCategory)?.label

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-28">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-tinta-dim hover:text-title transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Inicio
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-tinta tracking-wide">La Carta</h1>
        <p className="text-tinta-dim mt-3 max-w-lg mx-auto">
          Cortes a las brasas, pescados del día y una bodega pensada para acompañar cada plato.
        </p>
      </div>

      <div className="mb-10">
        <CategoryTabs
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {selectedCategory === 'todas' && !isLoading ? (
        <div className="max-w-3xl mx-auto">
          {groupedByCategory?.map(({ category, items: catItems }) => (
            <section key={category.id} className="mb-14">
              <SectionHeading title={category.label} />
              {category.note && (
                <p className="text-center text-xs text-tinta-dim italic -mt-6 mb-6">{category.note}</p>
              )}
              <MenuList items={catItems} isLoading={false} onAdd={handleAdd} />
            </section>
          ))}
        </div>
      ) : (
        <>
          {activeLabel && <SectionHeading title={activeLabel} />}
          {activeCategoryNote && (
            <p className="text-center text-xs text-tinta-dim italic -mt-6 mb-6 max-w-lg mx-auto">
              {activeCategoryNote}
            </p>
          )}
          <MenuList items={items} isLoading={isLoading} onAdd={handleAdd} />
        </>
      )}

      {pickerItem && (
        <GuarnicionPicker
          item={pickerItem}
          onConfirm={handleConfirmGuarnicion}
          onCancel={() => setPickerItem(null)}
        />
      )}

      {hasCartItems ? (
        <Link
          to="/delivery"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2.5rem)] max-w-sm inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-medium tracking-wide shadow-lg bg-teal text-crema hover:bg-teal/90 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={2} />
          Realizar pedido
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2.5rem)] max-w-sm inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-medium tracking-wide shadow-lg bg-linea text-tinta-dim cursor-not-allowed select-none"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={2} />
          Realizar pedido
        </span>
      )}
    </div>
  )
}
