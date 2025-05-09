import { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type SnTabsProps = {
  tabs: {
    label: string;
    content: ReactNode;
    key?: string;
  }[];
  value?: string;
  onValueChange?: (val: string) => void;
};

export function SnTabs({ tabs, value, onValueChange }: SnTabsProps) {
  if (tabs.length === 0) return null;

  const firstKey = tabs[0].key ?? tabs[0].label;

  return (
    <Tabs
      value={value}
      defaultValue={firstKey}
      onValueChange={onValueChange}
      className="w-full"
    >
      <TabsList className="mb-4 w-full">
        {tabs.map(({ label, key }) => (
          <TabsTrigger key={key ?? label} value={key ?? label}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(({ content, label, key }) => (
        <TabsContent key={key ?? label} value={key ?? label}>
          {content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
