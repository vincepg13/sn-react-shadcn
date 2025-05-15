import { useState } from 'react'
import { RHFField } from '@kit/types/form-schema'
import { Input } from '@kit/components/ui/input'
import { useFieldUI } from '../contexts/FieldUIContext'
import { Button } from '@kit/components/ui/button'
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react'

interface SnFieldUrlProps {
  rhfField: RHFField
  onChange: (val: string) => void
}

export function SnFieldUrl({ rhfField, onChange }: SnFieldUrlProps) {
  const { readonly } = useFieldUI()
  const [locked, setLocked] = useState(!rhfField.value)

  return (
    <div className="flex w-full justify-between items-center space-x-2">
      {locked && (
        <a href={rhfField.value + ''} className="text-blue-600" style={{ wordBreak: 'break-all' }}>
          {rhfField.value}{' '}
        </a>
      )}
      {!locked && (
        <Input
          {...rhfField}
          value={String(rhfField.value ?? '')}
          onChange={e => rhfField.onChange(e)}
          onBlur={e => onChange(e.target.value)}
          disabled={locked || readonly}
          className="w-full"
        />
      )}
      <Button type="button" variant="outline" size="icon" onClick={() => setLocked(!locked)}>
        {locked ? <LockKeyholeOpen /> : <LockKeyhole />}
      </Button>
    </div>
  )
}
