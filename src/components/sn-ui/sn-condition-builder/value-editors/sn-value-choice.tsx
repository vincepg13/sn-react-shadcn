import { SnValueChoiceItem } from '@kit/types/condition-schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/components/ui/select'
import { X } from 'lucide-react'

type ChoiceProps = {
  value: string
  choices: SnValueChoiceItem[]
  clearable?: boolean
  size?: 'sm' | 'default'
  onChange: (value: string, display: string) => void
}

export function SnValueChoice({ value, choices, size, clearable = true, onChange }: ChoiceProps) {
  const placeholder = choices.length ? '-- Empty --' : '-- No Matching Fields --'
  return (
    <div className="relative w-full [&_.lucide-chevron-down]:ml-[20px]">
      <Select
        value={value}
        onValueChange={v => onChange(v, choices.find(c => c.value == v)?.label || v)}
        disabled={!choices.length}
      >
        <SelectTrigger className="w-full" size={size}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {choices
            .filter(c => c.value)
            .map(choice => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {clearable && value && (
        <X
          className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
          onClick={() => onChange('', '')}
        />
      )}
    </div>
  )
}
