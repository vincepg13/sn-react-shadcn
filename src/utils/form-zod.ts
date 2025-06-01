import { SnFieldSchema } from '@kit/types/form-schema'
import { z, ZodTypeAny } from 'zod'

export function mapFieldToZod(field: SnFieldSchema): ZodTypeAny {
  let base: ZodTypeAny
  const allowEmpty = field.sys_readonly || !field.mandatory 

  switch (field.type) {
    case 'glide_list':
    case 'reference':
      base = z.string()
      if (!allowEmpty) {
        base = (base as z.ZodString).refine(val => val !== '', {
          message: 'A selection is required',
        })
      }
      break

    case 'choice':
      base = z.enum(field.choices!.map(c => c.value) as [string, ...string[]])
      if (!allowEmpty) {
        base = base.refine(val => val !== '', {
          message: 'A selection is required',
        })
      }
      break

    case 'boolean':
      base = z
        .union([z.boolean(), z.literal('true'), z.literal('false')])
        .transform(val => val === true || val === 'true')
      break

    case 'glide_date':
      base = z.string().refine(val => (allowEmpty && val === '') || /^\d{4}-\d{2}-\d{2}$/.test(val), {
        message: 'Invalid date format',
      })
      break

    case 'glide_date_time':
      base = z.string().refine(val => (allowEmpty && val === '') || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val), {
        message: 'Invalid date format',
      })
      break

    case 'integer':
    case 'longint':
      base = mapNumericField({ required: !allowEmpty, integer: true })
      break

    case 'decimal':
    case 'float':
      base = mapNumericField({ required: !allowEmpty })
      break

    case 'currency':
      base = z.string().refine(
        val => {
          // if (allowEmpty && val === '') return true
          if (val.includes('undefined')) return false

          const parts = val.split(';')
          if (parts.length !== 2) return false
          
          const [code, value] = parts
          return /^[A-Z]{3}$/.test(code) && !isNaN(Number(value))
        },
        {
          message: 'Must be in format CODE;amount (e.g. GBP;500)',
        }
      )
      break

    //No match assume string
    default:
      base = z.string()
      if (field.max_length && base instanceof z.ZodString) {
        base = base.max(field.max_length)
      }
      if (!allowEmpty) {
        base = (base as z.ZodString).min(1, '')
      }
      break
    // default:
    // base = z.any()
  }

  return allowEmpty ? base.optional() : base
}

function mapNumericField({
  required,
  integer,
  min,
  max,
}: {
  required: boolean
  integer?: boolean
  min?: number
  max?: number
}): ZodTypeAny {
  let base = z.number()

  if (integer) {
    base = base.int()
  }
  if (typeof min === 'number') {
    base = base.min(min)
  }
  if (typeof max === 'number') {
    base = base.max(max)
  }

  return z.preprocess(
    val => {
      if (val === '' || val === null || val === undefined) return undefined
      const num = Number(val)
      return isNaN(num) ? undefined : num
    },
    required ? base : base.optional()
  )
}
