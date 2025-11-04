'use client'

import { useState } from 'react'

const AVAILABLE_ICONS = [
  '👤', '😀', '😎', '🤓', '🥳', '🤩', '😇', '🤠',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🎮', '🎯', '🎲', '🎸', '🎺', '🎨', '⚽', '🏀',
  '🍕', '🍔', '🍺', '☕', '🍩', '🌮', '🍣', '🎂',
]

interface IconPickerProps {
  selectedIcon: string
  onSelectIcon: (icon: string) => void
}

export default function IconPicker({ selectedIcon, onSelectIcon }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Selected Icon Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 text-4xl bg-purple-100 hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors border-2 border-purple-300"
      >
        {selectedIcon}
      </button>

      {/* Icon Grid Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full mt-2 bg-white rounded-lg shadow-2xl p-4 z-20 border-2 border-purple-200">
            <div className="grid grid-cols-8 gap-2 max-w-xs">
              {AVAILABLE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    onSelectIcon(icon)
                    setIsOpen(false)
                  }}
                  className={`w-10 h-10 text-2xl hover:bg-purple-100 rounded transition-colors ${
                    selectedIcon === icon ? 'bg-purple-200 ring-2 ring-purple-500' : ''
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}