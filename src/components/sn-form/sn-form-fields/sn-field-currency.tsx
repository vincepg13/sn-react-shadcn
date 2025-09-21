import { useState } from 'react'
import { SnFieldNumeric } from './SnFieldNumeric'
import { RHFField, SnCurrencyField } from '@kit/types/form-schema'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/components/ui/select'

interface SnFieldCurrencyProps {
  field: SnCurrencyField
  readonly?: boolean
  rhfField?: RHFField
  allowNull?: boolean
  onChange: (val: string) => void
}

export function SnFieldCurrency({ field, readonly, allowNull, onChange }: SnFieldCurrencyProps) {
  const nullValue = allowNull ? undefined : 0
  const [currency, setCurrency] = useState(field.currencyCode!)
  const [currencyValue, setCurrencyValue] = useState<number|undefined>(field.currencyValue ? +field.currencyValue : nullValue)

  const handleChange = (code: string, value: number|undefined) => {
    if (!code) return
    setCurrency(code)
    setCurrencyValue(value)
    onChange(code + ';' + value)
  }

  return (
    <div className="flex w-full items-center">
      <Select value={currency} onValueChange={val => handleChange(val, currencyValue)} disabled={readonly}>
        <SelectTrigger className="rounded-r-[0]">
          <SelectValue placeholder="-- Code --" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>{field.label}</SelectLabel>
            {field.currencyCodes!.map(choice => (
              <SelectItem key={choice.code} value={choice.code}>
                {choice.symbol != choice.code && choice.symbol} {choice.code}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex-1 w-full">
        <SnFieldNumeric
          className="rounded-[0] border-l-0"
          value={currencyValue}

          onValueChange={value => handleChange(currency, value)}
          thousandSeparator=","
          decimalSeparator="."
          decimalScale={2}
          fixedDecimalScale={true}
          readonly={readonly}
        />
      </div>
    </div>
  )
}
