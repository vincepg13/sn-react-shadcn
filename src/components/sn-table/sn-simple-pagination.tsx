import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Pagination, PaginationContent, PaginationItem } from '../ui/pagination'
import { ChevronLeftIcon, ChevronRightIcon, DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons'

interface SnSimplePagProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function SnSimplePagination({ currentPage, totalPages, onPageChange }: SnSimplePagProps) {
  // Coerce & clamp
  const total = Math.max(1, Number.isFinite(+totalPages) ? +totalPages : 1)
  const page = clamp(Number.isFinite(+currentPage) ? +currentPage : 1, 1, total)

  // Build options with a plain for-loop (avoids Array.from mapper quirks)
  const optionValues: string[] = []
  for (let i = 1; i <= total; i++) optionValues.push(String(i))

  const go = (p: number) => onPageChange(clamp(p, 1, total))

  return (
    <Pagination>
      <PaginationContent className="flex items-center gap-2">
        <PaginationItem>
          <Button variant="outline" size="icon" disabled={page === 1} onClick={() => go(1)}>
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Button variant="outline" size="icon" disabled={page === 1} onClick={() => go(page - 1)}>
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Select value={String(page)} onValueChange={(val) => go(parseInt(val, 10))}>
            <SelectTrigger className="w-24 h-8">
              <SelectValue placeholder={`Page ${page}`} />
            </SelectTrigger>
            <SelectContent>
              {optionValues.map((v) => (
                <SelectItem key={v} value={v}>
                  {`Page ${v}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PaginationItem>

        <PaginationItem>
          <Button variant="outline" size="icon" disabled={page === total} onClick={() => go(page + 1)}>
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>

        <PaginationItem>
          <Button variant="outline" size="icon" disabled={page === total} onClick={() => go(total)}>
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}