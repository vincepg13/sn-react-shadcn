import { ChevronDown, ChevronUp } from 'lucide-react'
import { forwardRef, RefObject, useCallback, useEffect, useState, useRef } from 'react'
import { NumericFormat, NumericFormatProps } from 'react-number-format'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { useFieldUI } from '../contexts/FieldUIContext'

interface NumberInputProps extends Omit<NumericFormatProps, 'value' | 'onValueChange'> {
  stepper?: number
  thousandSeparator?: string
  placeholder?: string
  defaultValue?: number
  min?: number
  max?: number
  value?: number
  suffix?: string
  prefix?: string
  onValueChange?: (value: number | undefined) => void
  fixedDecimalScale?: boolean
  decimalScale?: number
}

export const SnFieldNumeric = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLInputElement>(null)
    const combinedRef = ref || internalRef
    const { readonly } = useFieldUI()
    const [value, setValue] = useState<number | undefined>(controlledValue ?? defaultValue)

    const handleIncrement = useCallback(() => {
      setValue(prev => (prev === undefined ? stepper ?? 1 : Math.min(prev + (stepper ?? 1), max)))
    }, [stepper, max])

    const handleDecrement = useCallback(() => {
      setValue(prev => (prev === undefined ? -(stepper ?? 1) : Math.max(prev - (stepper ?? 1), min)))
    }, [stepper, min])

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement === (combinedRef as RefObject<HTMLInputElement>).current) {
          if (e.key === 'ArrowUp') {
            handleIncrement()
          } else if (e.key === 'ArrowDown') {
            handleDecrement()
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => {
        window.removeEventListener('keydown', handleKeyDown)
      }
    }, [handleIncrement, handleDecrement, combinedRef])

    useEffect(() => {
      if (controlledValue !== undefined) {
        setValue(controlledValue)
      }
    }, [controlledValue])

    const handleChange = (values: { value: string; floatValue: number | undefined }) => {
      const newValue = values.floatValue === undefined ? undefined : values.floatValue
      setValue(newValue)
      if (onValueChange) {
        onValueChange(newValue)
      }
    }

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          setValue(min)
          ;(ref as RefObject<HTMLInputElement>).current!.value = String(min)
        } else if (value > max) {
          setValue(max)
          ;(ref as RefObject<HTMLInputElement>).current!.value = String(max)
        }
      }
    }

    return (
      <div className="flex items-center">
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          valueIsNumericString
          onBlur={handleBlur}
          required={true}
          disabled={readonly}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-r-none relative h-9"
          getInputRef={combinedRef} // Use combined ref
          {...props}
        />
        <div className="flex flex-col h-9">
          <Button
            type="button"
            aria-label="Increase value"
            className="h-1/2 px-2 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleIncrement}
            disabled={readonly || value === max}
          >
            <ChevronUp size={10} />
          </Button>
          <Button
            type="button"
            aria-label="Decrease value"
            className="h-1/2 px-2 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative"
            variant="outline"
            onClick={handleDecrement}
            disabled={readonly || value === min}
          >
            <ChevronDown size={10} />
          </Button>
        </div>
      </div>
    )
  }
)
