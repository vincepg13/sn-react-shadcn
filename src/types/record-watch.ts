type FieldVal = {
  value: string
  display_value: string
}

type Operation = 'insert' | 'update' | 'delete'

export interface SnAmbMessage {
  channel: string
  data: {
    action: string
    operation: Operation 
    table_name: string
    display_value: string
    sys_id: string
    changes: string[]
    changes_with_users: Record<string, string>
    record?: Record<string, FieldVal>
  }
  ext: {
    sys_id: string
    from_user: string
    processed_by_glide: boolean
  }
}
