import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { SnConditionBuilderRef } from '@kit/components/sn-ui/sn-condition-builder/sn-condition-builder'
import { RefObject, useRef, useState } from 'react'
import { SnConditionHandle } from '@kit/components/sn-ui/sn-condition-builder/sn-conditions'
import { createPortal } from 'react-dom'
import { Button } from '@kit/components/ui/button'
import { Split } from 'lucide-react'
import { useFieldUI } from '../contexts/FieldUIContext'
import { SnFieldTextarea } from './sn-field-textarea'

interface SnFieldConditionProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  dependentValue: string
  adornmentRef?: RefObject<HTMLElement | null>
  onFocus: () => void
}

export function SnFieldCondition({
  field,
  rhfField,
  adornmentRef,
  dependentValue,
  onChange,
  onFocus,
}: SnFieldConditionProps) {
  const { readonly } = useFieldUI()
  const conditionRef = useRef<SnConditionHandle>(null)
  const [fieldValue] = useState(String(rhfField.value || ''))
  const extended = field.attributes?.extended_operators === 'VALCHANGES;CHANGESFROM;CHANGESTO'

  return (
    <div>
      {readonly ? (
        <SnFieldTextarea field={field} rhfField={rhfField} onChange={onChange} onFocus={onFocus} />
      ) : (
        <div>
          <SnConditionBuilderRef
            ref={conditionRef}
            table={dependentValue}
            encodedQuery={fieldValue}
            showControls={false}
            extendToChanges={extended}
            onModelChange={onChange}
          />
          {adornmentRef?.current
            ? createPortal(
                <div className="flex gap-2">
                  {/* <Button size="sm" onClick={() => conditionRef.current?.clearQuery()} variant="outline">Clear Query</Button> */}
                  <Button size="sm" onClick={() => conditionRef.current?.addGroup()} variant="outline">
                    <Split className="rotate-90" /> Add Or Clause
                  </Button>
                </div>,
                adornmentRef.current
              )
            : null}
        </div>
      )}
    </div>
  )
}
