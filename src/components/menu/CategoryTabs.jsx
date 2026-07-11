export default function CategoryTabs({ categories, selected, onSelect }) {
  const allTabs = [{ id: 'todas', label: 'Toda la carta' }, ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
      {allTabs.map((cat) => {
        const isActive = selected === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-1.5 rounded-full text-sm border transition-colors ${
              isActive
                ? 'border-title text-title bg-crema-soft font-medium'
                : 'border-linea text-tinta-dim hover:text-tinta hover:border-tinta-dim'
            }`}
          >
            {isActive && <span className="title-dot w-1.5 h-1.5 rounded-full bg-title" />}
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
