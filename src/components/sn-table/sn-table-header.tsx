import { Input } from '../ui/input';
import { CircleX, ListFilter} from 'lucide-react';
import { Fragment, useEffect, useRef, useState, ReactNode } from 'react';
import { SnLoadingSpinner } from '../sn-ui/sn-loader';
import { SnSimpleTooltip } from '../sn-ui/sn-tooltip';
import { Button } from '../ui/button';
import { SnConditionBuilder } from '../sn-ui/sn-condition-builder/sn-condition-builder';
import { useDebouncedFn } from '@kit/hooks/useDebounceFn';


type SnTableHeaderProps = {
  title: string;
  tagline?: string;
  table: string;
  displayField: string;
  query?: string;
  uuid?: string;
  isFetching?: boolean;
  actions?: ReactNode[];
  onQueryChange: (nextQuery: string) => void;
  onResetQuery: () => void;
};

export function SnTableHeader({
  title,
  tagline,
  table,
  displayField,
  query,
  uuid,
  isFetching,
  actions,
  onQueryChange,
  onResetQuery,
}: SnTableHeaderProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchClearable, setSearchClearable] = useState(false);
  const prevQueryRef = useRef<string | undefined>(undefined);

  // Query on debounced search from input
  const handleChange = useDebouncedFn((value: string) => {
    if (!value) return onResetQuery();
    const nextQuery = value.startsWith('*')
      ? `${displayField}LIKE${value.slice(1)}`
      : `${displayField}STARTSWITH${value}`;
    onQueryChange(nextQuery);
  }, 300);

  // Handle query updates from condition builder
  const handleQueryChange = (builderQuery: string) => {
    if (!builderQuery) return onResetQuery();
    if (query === builderQuery) return;

    setShowFilter(false);
    onQueryChange(builderQuery);
  };

  // Sync clearable with query
  useEffect(() => {
    setSearchClearable(!!searchValue);
  }, [searchValue]);

  useEffect(() => {
    let nextValue = '';

    if (query) {
      const startsWithPrefix = `${displayField}STARTSWITH`;
      const likePrefix = `${displayField}LIKE`;

      if (query.startsWith(startsWithPrefix)) {
        nextValue = query.slice(startsWithPrefix.length);
      } else if (query.startsWith(likePrefix)) {
        nextValue = `*${query.slice(likePrefix.length)}`;
      }
    }

    setSearchValue(prev => (prev === nextValue ? prev : nextValue));
  }, [query, displayField]);

  useEffect(() => {
    if (prevQueryRef.current !== undefined && prevQueryRef.current !== query && showFilter) {
      setShowFilter(false);
    }
    prevQueryRef.current = query;
  }, [query, showFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between w-full flex-wrap gap-4">
        <div className='flex-1'>
          <h2 className="text-2xl font-bold tracking-tight flex gap-1 items-center">{title}</h2>
          {tagline ? <p className="text-muted-foreground">{tagline}</p> : null}
        </div>
        <div className="flex items-center gap-2 w-full mt-2 lg:w-auto lg:mt-0">
          {isFetching && <SnLoadingSpinner className="h-6 w-6" />}
          <div className="relative w-full">
            <Input
              type="text"
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                handleChange(e.target.value);
              }}
              placeholder={`Search by ${displayField}...`}
              className="pr-5"
            />
            {searchClearable && (
              <CircleX
                className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
                onClick={() => {
                  setSearchValue('');
                  onResetQuery();
                }}
              />
            )}
          </div>
          <SnSimpleTooltip content={showFilter ? 'Close Advanced Filter' : 'Open Advanced Filter'}>
            <Button variant="outline" size="icon" onClick={() => setShowFilter(!showFilter)}>
              <span className={`transition-transform duration-300 ease-in-out ${showFilter ? 'rotate-180' : ''}`}>
                <ListFilter />
              </span>
            </Button>
          </SnSimpleTooltip>
          {actions?.map((action, index) => (
            <Fragment key={`sn-table-header-action-${index}`}>{action}</Fragment>
          ))}
        </div>
      </div>
      <div className={showFilter ? 'block' : 'hidden'}>
        <SnConditionBuilder
          key={uuid}
          table={table}
          onQueryBuilt={handleQueryChange}
          encodedQuery={query || ''}
        />
      </div>
    </div>
  );
}
