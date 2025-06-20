import { useCallback } from 'react'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { SnFieldCurrency } from '@kit/components/sn-form/sn-form-fields/sn-field-currency'
import { Input } from '@kit/components/ui/input'

type SnValueCurrencyProps = {
  field: string
  value: string
  operator?: string
  onChange: (val: string) => void
}

function extractCurrencyValue(value: string): string {
  const match = value.match(/^[^(]+\(([^,]+),\s*([^,]+),\s*([^)]+)\)/)

  if (match && match[3]) {
    return match[3].trim().replace(/^['"]|['"]$/g, '')
  }

  return ''
}

export function SnValueCurrency({ field, value, onChange }: SnValueCurrencyProps) {
  const { table, currencyMeta } = useCondMeta()

  // Set Outbound Query Value
  const handleChange = useCallback(
    (val: string) => {
      const computed = `javascript:global.getCurrencyFilter('${table}','${field}', '${val}')`
      if (value !== computed) {
        onChange(computed)
      }
    },
    [field, onChange, table, value]
  )

  if (currencyMeta.length) {
    let currencyCode = ''
    let currencyValue = ''

    const inputCurrencyValue = extractCurrencyValue(value || '')
    if (inputCurrencyValue) {
      const parts = inputCurrencyValue.split(';')
      if (currencyMeta.find(c => c.code === parts[0])) currencyCode = parts[0]
      if (!isNaN(+parts[1])) currencyValue = parts[1]
    }

    if (!currencyCode) currencyCode = (currencyMeta.find(c => c.default) || currencyMeta[0]).code

    const currencyField = {
      currencyCode,
      currencyValue,
      label: 'Currency Value',
      currencyCodes: currencyMeta,
    }

    return <SnFieldCurrency field={currencyField} readonly={false} onChange={handleChange} allowNull={true} />
  } else {
    return <Input disabled={true} className="w-full" placeholder="Loading..." />
  }
}
