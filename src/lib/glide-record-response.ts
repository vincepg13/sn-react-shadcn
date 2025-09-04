export interface GrField {
  type: string
  value: string
  displayvalue?: string // often omitted in responses
}

export type Gr = Record<string, GrField> & {
  $$displayValue?: string
}

export interface GrResponse {
  records: Gr[]
}

export class GlideRecordResponse {
  private index: number
  private records: Gr[]

  constructor(response: GrResponse) {
    this.index = -1
    this.records = response.records
  }

  next(): boolean {
    if (!this.hasNext()) return false

    this.index++
    return true
  }

  hasNext() {
    return this.index + 1 < this.records.length
  }

  getValue(field: string): string | undefined {
    const rec = this.records[this.index]
    return rec?.[field]?.value
  }

  getDisplayValue(field: string): string | undefined {
    const rec = this.records[this.index]
    return rec?.[field]?.displayvalue ?? this.getValue(field)
  }
}
