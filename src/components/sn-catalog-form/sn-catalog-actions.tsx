import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@kit/components/ui/alert'
import type { SnCatalogSubmissionResult } from '@kit/types/catalog-schema'

type SnCatalogActionsProps = {
  error: string | null
  result: SnCatalogSubmissionResult | null
  submitLabel: string
  submitting: boolean
  submitted: boolean
}

export function SnCatalogActions({
  error,
  result,
  submitLabel,
  submitting,
  submitted,
}: SnCatalogActionsProps) {
  return (
    <div className="mt-6 space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Submission failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {submitted && result && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Submitted successfully</AlertTitle>
          <AlertDescription>
            {result.number ? `${result.number} was created.` : 'The record was created successfully.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button type="submit" disabled={submitting || submitted}>
          {submitting ? 'Submitting...' : submitted ? 'Submitted' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
