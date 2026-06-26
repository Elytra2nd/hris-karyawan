'use client'

import * as React from 'react'
import {
  Combobox,
  ComboboxInput,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox'

export interface ComboboxOption {
  value: string
  label: string
  hint?: string
}

interface SelectComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  options: ComboboxOption[] | string[]
  placeholder?: string
  emptyText?: string
  name?: string
  required?: boolean
  disabled?: boolean
  id?: string
  size?: 'sm' | 'default' | 'lg'
}

function toOption(o: ComboboxOption | string): ComboboxOption {
  return typeof o === 'string' ? { value: o, label: o } : o
}

export function SelectCombobox({
  value,
  onValueChange,
  options,
  placeholder = 'Pilih opsi...',
  emptyText = 'Tidak ditemukan',
  name,
  required,
  disabled,
  id,
  size = 'default',
}: SelectComboboxProps) {
  const opts = React.useMemo(() => options.map(toOption), [options])
  const [internal, setInternal] = React.useState(value ?? '')
  const current = value ?? internal

  const selectedOption = opts.find(o => o.value === current) ?? null

  const handleChange = (next: ComboboxOption | null) => {
    const v = next?.value ?? ''
    setInternal(v)
    onValueChange?.(v)
  }


  return (
    <>
      <Combobox
        items={opts}
        value={selectedOption}
        onValueChange={handleChange}
        itemToStringValue={(item: ComboboxOption) => item.value}
        itemToStringLabel={(item: ComboboxOption) => item.label}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          size={size}
        />
        <ComboboxPopup>
          <ComboboxList>
            {(item: ComboboxOption) => (
              <ComboboxItem key={item.value} value={item}>
                <span className="flex items-center justify-between gap-4 w-full">
                  <span>{item.label}</span>
                  {item.hint && (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{item.hint}</span>
                  )}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty className="px-3 py-2 text-sm text-muted-foreground">
            {emptyText}
          </ComboboxEmpty>
        </ComboboxPopup>
      </Combobox>

      {name && (
        <input type="hidden" name={name} value={current} required={required} />
      )}
    </>
  )
}
