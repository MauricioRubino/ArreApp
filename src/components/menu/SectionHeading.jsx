export default function SectionHeading({ title, size = 'lg' }) {
  const textSize = size === 'lg' ? 'text-3xl sm:text-4xl' : 'text-lg'

  if (size !== 'lg') {
    return (
      <h3 className="font-display text-title-soft text-lg tracking-wide mt-8 mb-3 first:mt-0">
        {title}
      </h3>
    )
  }

  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="hidden sm:block flex-1 h-px bg-linea" />
      <h2 className={`font-display ${textSize} text-title tracking-wide text-center whitespace-nowrap`}>
        {title}
      </h2>
      <span className="hidden sm:block flex-1 h-px bg-linea" />
    </div>
  )
}
