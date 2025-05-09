import { SnTabs } from '../../sn-ui/sn-tabs';
import { SnFormSection } from './sn-form-section';
import { ReactNode, useEffect, useMemo } from 'react';

type Field = { name: string; type: string };
type Column = { fields: Field[] };

export type SnSection = {
  id: string;
  captionDisplay?: string;
  _parent?: string;
  _bootstrap_cells: number;
  columns: Column[];
};

type SnFormLayoutProps = {
  sections: SnSection[];
  renderField: (name: string) => ReactNode;
  onFieldTabMap?: (map: Record<string, string>) => void;
  overrideTab?: string;
  clearOverrideTab?: () => void;
};

export function SnFormLayout({
  sections,
  renderField,
  onFieldTabMap,
  overrideTab,
  clearOverrideTab,
}: SnFormLayoutProps) {
  const { nestedMap, topLevelSections } = useMemo(() => {
    const map = new Map<string, SnSection[]>();
    const topLevel: SnSection[] = [];

    for (const section of sections) {
      if (section._parent) {
        if (!map.has(section._parent)) map.set(section._parent, []);
        map.get(section._parent)!.push(section);
      } else if (section.captionDisplay) {
        topLevel.push(section);
      }
    }

    return { nestedMap: map, topLevelSections: topLevel };
  }, [sections]);

  const primarySection = topLevelSections[0];
  const tabSections = topLevelSections.slice(1);

  const fieldToTab = useMemo(() => {
    const map: Record<string, string> = {};
    const collectFields = (sect: SnSection, tabKey: string) => {
      for (const column of sect.columns) {
        for (const field of column.fields) {
          map[field.name] = tabKey;
        }
      }
    };

    tabSections.forEach(section => {
      const tabKey = section.id;
      const children = nestedMap.get(section.id) ?? [];
      collectFields(section, tabKey);
      children.forEach(child => collectFields(child, tabKey));
    });

    return map;
  }, [tabSections, nestedMap]);

  useEffect(() => {
    onFieldTabMap?.(fieldToTab);
  }, [fieldToTab, onFieldTabMap]);

  const tabs = tabSections.map(section => {
    const tabKey = section.id;
    const children = nestedMap.get(section.id) ?? [];

    return {
      key: tabKey,
      label: section.captionDisplay!,
      content: (
        <div className="space-y-6">
          <SnFormSection
            columns={section.columns}
            bootstrapCells={section._bootstrap_cells}
            renderField={renderField}
          />
          {children.map(child => (
            <SnFormSection
              key={child.id}
              columns={child.columns}
              bootstrapCells={child._bootstrap_cells}
              renderField={renderField}
            />
          ))}
        </div>
      ),
    };
  });

  return (
    <div className="space-y-8">
      {primarySection && (
        <SnFormSection
          columns={primarySection.columns}
          bootstrapCells={primarySection._bootstrap_cells}
          renderField={renderField}
        />
      )}

      {tabs.length > 0 && (
        <SnTabs
          tabs={tabs}
          value={overrideTab}
          onValueChange={() => {
            clearOverrideTab?.();
          }}
        />
      )}
    </div>
  );
}
