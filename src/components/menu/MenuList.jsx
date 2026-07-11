import MenuItemRow from './MenuItemRow'
import SectionHeading from './SectionHeading'

function SkeletonRow() {
  return (
    <div className="py-3 border-b border-linea/60 animate-pulse">
      <div className="h-4 w-1/3 bg-linea rounded mb-2" />
      <div className="h-3 w-2/3 bg-linea/70 rounded" />
    </div>
  )
}

function groupBySubgroup(items) {
  const groups = []
  const seen = new Map()
  for (const item of items) {
    const key = item.subgroup || null
    if (!seen.has(key)) {
      seen.set(key, { subgroup: key, items: [] })
      groups.push(seen.get(key))
    }
    seen.get(key).items.push(item)
  }
  return groups
}

export default function MenuList({ items, isLoading, onAdd }) {
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-tinta-dim">
        <p className="font-display text-2xl text-tinta mb-1">No hay platos en esta categoría</p>
        <p className="text-sm">Probá con otra sección de la carta.</p>
      </div>
    )
  }

  const hasSubgroups = items.some((item) => item.subgroup)

  if (!hasSubgroups) {
    return (
      <div className="max-w-3xl mx-auto">
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    )
  }

  const groups = groupBySubgroup(items)

  return (
    <div className="max-w-3xl mx-auto">
      {groups.map((group) => (
        <div key={group.subgroup ?? 'sin-grupo'}>
          {group.subgroup && <SectionHeading title={group.subgroup} size="sm" />}
          {group.items.map((item) => (
            <MenuItemRow key={item.id} item={item} onAdd={onAdd} />
          ))}
        </div>
      ))}
    </div>
  )
}
