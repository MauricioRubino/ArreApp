import { useState } from 'react'
import { X } from 'lucide-react'
import { GUARNICIONES } from '../../data/guarnicionesData'

export default function GuarnicionPicker({ item, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-tinta/40 backdrop-blur-sm px-0 sm:px-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-crema rounded-t-2xl sm:rounded-lg border border-linea max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-linea/60">
          <div>
            <p className="text-xs uppercase tracking-wide text-tinta-dim mb-1">Guarnición incluida</p>
            <h3 className="font-display text-xl text-tinta tracking-wide">{item.name}</h3>
          </div>
          <button
            onClick={onCancel}
            aria-label="Cerrar"
            className="text-tinta-dim hover:text-title transition-colors shrink-0"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-1">
          {GUARNICIONES.map((guarnicion) => {
            const isSelected = selected === guarnicion
            return (
              <button
                key={guarnicion}
                onClick={() => setSelected(guarnicion)}
                className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  isSelected
                    ? 'border-title bg-title/5 text-tinta'
                    : 'border-transparent hover:bg-crema-soft text-tinta'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${
                    isSelected ? 'border-title' : 'border-linea'
                  }`}
                >
                  {isSelected && <span className="w-2 h-2 rounded-full bg-title" />}
                </span>
                <span className="text-sm">{guarnicion}</span>
              </button>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t border-linea/60">
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="w-full bg-title hover:bg-title-soft disabled:opacity-40 text-crema font-medium tracking-wide rounded-lg px-6 py-3 transition-colors"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  )
}
