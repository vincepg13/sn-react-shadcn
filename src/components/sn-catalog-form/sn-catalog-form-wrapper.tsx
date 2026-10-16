import { AlertCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@kit/components/ui/alert'
import { getCatalogApiErrorMessage, getCatalogItemMetadata } from '@kit/utils/catalog-api'
import { SnCatalogForm, type SnCatalogFormProps } from './sn-catalog-form'
import { SnCatalogFormSkeleton } from './sn-catalog-form-skeleton'
import type {
  SnCatalogApis,
  SnCatalogFormOptions,
  SnCatalogMetadata,
  SnCatalogSubmissionResult,
} from '@kit/types/catalog-schema'
import type { SnReferenceFieldCallbacks } from '@kit/types/form-schema'

export type SnCatalogFormWrapperProps = {
  catalogItemId: string
  apis: SnCatalogApis
  formOptions?: SnCatalogFormOptions
  referenceFieldCallbacks?: SnReferenceFieldCallbacks
  onSubmitted?: (result: SnCatalogSubmissionResult) => void | Promise<void>
}

export function SnCatalogFormWrapper({
  catalogItemId,
  apis,
  formOptions,
  referenceFieldCallbacks,
  onSubmitted,
}: SnCatalogFormWrapperProps) {
  const fetchIdRef = useRef(0)
  const [metadata, setMetadata] = useState<SnCatalogMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    setMetadata(null)

    void getCatalogItemMetadata(apis.itemData, controller.signal)
      .then(result => {
        if (result.item.sys_id !== catalogItemId) {
          throw new Error('Catalog metadata did not match the requested item')
        }
        if (result.item.sys_class_name !== 'sc_cat_item_producer') {
          throw new Error('Only record producers are supported')
        }
        if (fetchId === fetchIdRef.current) setMetadata(result)
      })
      .catch(fetchError => {
        const message = getCatalogApiErrorMessage(fetchError, 'The record producer metadata could not be loaded')
        if (message && fetchId === fetchIdRef.current) setError(message)
      })
      .finally(() => {
        if (fetchId === fetchIdRef.current) setLoading(false)
      })

    return () => controller.abort()
  }, [apis.itemData, catalogItemId])

  if (loading) return <SnCatalogFormSkeleton />

  if (error || !metadata) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Catalog item unavailable</AlertTitle>
        <AlertDescription>{error || 'The record producer metadata was not returned.'}</AlertDescription>
      </Alert>
    )
  }

  const directApis: SnCatalogFormProps['apis'] = {
    serviceCatalogBase: apis.serviceCatalogBase,
    refDisplay: apis.refDisplay,
  }

  return (
    <SnCatalogForm
      key={metadata.item.sys_id}
      catalogItem={metadata.item}
      runtime={metadata.runtime}
      apis={directApis}
      formOptions={formOptions}
      referenceFieldCallbacks={referenceFieldCallbacks}
      onSubmitted={onSubmitted}
    />
  )
}
