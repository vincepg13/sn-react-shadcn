import { SnValueChoiceItem } from '@kit/types/condition-schema'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/components/ui/select'
import { X } from 'lucide-react'

type ChoiceProps = {
  value: string
  choices: SnValueChoiceItem[]
  onChange: (value: string) => void
}

export function SnValueChoice({ value, choices, onChange }: ChoiceProps) {
  return (
    <div className="relative w-full">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="-- Empty --" />
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
      {value && (
        <X
          className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
          onClick={() => onChange('')}
        />
      )}
    </div>
  )
}
