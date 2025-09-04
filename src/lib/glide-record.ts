import { getAxiosInstance } from '@kit/utils/axios-client'
import { GlideRecordResponse } from './glide-record-response'

export class GlideRecord {
  private limit = 0
  private orderParts: string[] = []
  private orderDescParts: string[] = []
  private queryParts: string[] = []

  constructor(private table: string, private controller?: AbortController) {}

  addQuery(field: string, operator: string, value?: string) {
    if (!value) {
      this.queryParts.push(`${field}=${operator}`)
    } else {
      this.queryParts.push(`${field}${operator}${value}`)
    }
  }

  orderBy(field: string) {
    this.orderParts.push(field)
  }

  orderByDesc(field: string) {
    this.orderDescParts.push(field)
  }

  addOrderBy(field: string) {
    this.orderBy(field)
  }

  setLimit(limit: number) {
    this.limit = limit
  }

  getLimit() {
    return this.limit
  }

  getEncodedQuery() {
    return this.queryParts.join('^')
  }

  setEncodedQuery(encodedQuery: string) {
    this.queryParts.push(encodedQuery)
  }

  getTableName() {
    return this.table
  }

  async query(cb: (res: GlideRecordResponse) => void) {
    const axios = getAxiosInstance()
    const glideResponse = await axios.post('/angular.do?sysparm_type=gliderecord&operation=query', {
      table: this.table,
      query: this.getEncodedQuery(),
      limit: this.getLimit(),
      orderBy: this.orderParts.join(','),
      orderByDesc: this.orderDescParts.join(','),
    }, {
      signal: this.controller?.signal,
    })

    cb(new GlideRecordResponse(glideResponse.data))
  }

  //Unsupported
  get() {
    throw new Error('Client Side GlideRecord .get is not supported in react')
  }

  insert() {
    throw new Error('Client Side GlideRecord .insert is not supported in react')
  }

  deleteRecord() {
    throw new Error('Client Side GlideRecord .deleteRecord is not supported in react')
  }
}
