import { ReactNode } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

type SnTab = {
  label: string
  content: ReactNode
  key?: string
}

type SnTabsProps = {
  tabs: SnTab[]
  value?: string
  onValueChange?: (val: string) => void
}

export function SnTabs({ tabs, value, onValueChange }: SnTabsProps) {
  if (tabs.length === 0) return null

  const firstKey = tabs[0].key ?? tabs[0].label

  return (
    <Tabs value={value} defaultValue={firstKey} onValueChange={onValueChange} className="w-full">
      <div className="w-full overflow-x-auto mb-4">
        <div className="flex w-max min-w-full whitespace-nowrap">
          <TabsList className="flex-1">
            {tabs.map(({ label, key }) => (
              <TabsTrigger key={key ?? label} value={key ?? label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      {tabs.map(({ content, label, key }) => (
        <TabsContent key={key ?? label} value={key ?? label}>
          {content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
