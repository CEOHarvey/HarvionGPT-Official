'use client'

import { useState, useRef, useEffect } from 'react'
import { FiChevronDown, FiCheck, FiZap } from 'react-icons/fi'

export type ModelType = 'auto' | 'gpt-4.1' | 'gpt-4.1-bytez' | 'gpt-4.1-mini'

interface Model {
  id: ModelType
  name: string
  provider: string
  description?: string
}

const models: Model[] = [
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'Azure',
    description: 'Most powerful model',
  },
  {
    id: 'gpt-4.1-bytez',
    name: 'GPT-4.1 BYTEZ',
    provider: 'Bytez',
    description: 'High performance alternative',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 MINI',
    provider: 'Azure',
    description: 'Fast and efficient',
  },
]

interface ModelSelectorProps {
  selectedModel: ModelType
  onModelChange: (model: ModelType) => void
  autoMode: boolean
  onAutoModeChange: (enabled: boolean) => void
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  autoMode,
  onAutoModeChange,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedModelData = models.find((m) => m.id === selectedModel) || models[0]

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Model Selector Button - Compact & Professional */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="inline-flex items-center justify-between gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-lg hover:from-purple-100 hover:to-pink-100 hover:border-purple-300/50 transition-all text-gray-700 font-medium shadow-sm text-xs touch-manipulation cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <FiZap className="w-2.5 h-2.5 text-white" />
          </div>
          <span className="truncate text-xs whitespace-nowrap">
            {autoMode ? 'Auto' : selectedModelData.name}
          </span>
        </div>
        <FiChevronDown className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Compact & Mobile Optimized, Opens Upward */}
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-[100] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="fixed sm:absolute top-auto sm:bottom-full bottom-0 sm:bottom-auto left-0 right-0 sm:left-0 sm:right-auto sm:mb-2 sm:w-56 w-full max-h-[40vh] sm:max-h-[260px] bg-white border-t sm:border border-gray-200 rounded-t-2xl sm:rounded-xl shadow-2xl z-[101] overflow-hidden">
            {/* Header */}
            <div className="p-2.5 sm:p-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800">AI Model</h3>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Auto Mode Toggle - Compact */}
              <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800">Auto Mode</div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAutoModeChange(!autoMode)
                    if (!autoMode) {
                      onModelChange('auto')
                    }
                  }}
                  className={`relative w-9 h-4 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                    autoMode ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform shadow-sm ${
                      autoMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Models List - Compact */}
            <div className="overflow-y-auto max-h-[calc(40vh-100px)] sm:max-h-[200px]">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onModelChange(model.id)
                    onAutoModeChange(false)
                    setIsOpen(false)
                  }}
                  className={`w-full px-2.5 sm:px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer ${
                    selectedModel === model.id && !autoMode ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 ${
                      selectedModel === model.id && !autoMode ? 'ring-2 ring-purple-500' : ''
                    }`}>
                      <FiZap className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-800 truncate">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.provider}</div>
                    </div>
                  </div>
                  {selectedModel === model.id && !autoMode && (
                    <FiCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

