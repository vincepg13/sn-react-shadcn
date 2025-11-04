import { RHFField } from '@kit/types/form-schema'
import { SnFieldReference, SnReferenceProps } from './sn-field-reference'

interface SnFieldUserRolesProps extends SnReferenceProps {
  rhfField: RHFField
}

export function SnFieldUserRoles({
  field,
  table,
  rhfField,
  formValues,
  recordSysId,
  dependentValue,
  onChange,
}: SnFieldUserRolesProps) {
  const qualifier = `nameNOT IN${rhfField.value}^ORDERBYname`

  const refSpoof = {
    ...field,
    refTable: 'sys_user_role',
    type: 'glide_list',
    reference_qual: qualifier,
    ed: { ...field.ed, searchField: 'name', reference: 'sys_user_role', qualifier},
  }

  const onChangeWrapper = (_val: string | string[], displayValue?: string) => {
    const patchedVal = displayValue || ''
    onChange(patchedVal, displayValue)
  }

  return (
    <SnFieldReference
      field={refSpoof}
      table={table}
      recordSysId={recordSysId}
      formValues={formValues}
      dependentValue={dependentValue}
      forceRefQuery={true}
      onChange={onChangeWrapper}
    />
  )
}
