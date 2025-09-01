export class GlideRecord {
  private limit = 0
  private orderBy: string[] = []
  private orderByDesc: string[] = []
  private query = ''

  constructor(private table: string) {}
}