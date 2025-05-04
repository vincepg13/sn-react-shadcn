import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "../../../components/ui/popover";
import { Button } from "../../../components/ui/button";
import { Calendar } from "../../../components/ui/calendar";
import { SnFieldBaseProps } from "../../../types/form-schema";
import { useFieldUI } from "../contexts/FieldUIContext";
import { cn } from "../../../lib/utils";

export function SnFieldDate({ rhfField, onChange }: SnFieldBaseProps<string>) {
  const { readonly } = useFieldUI();

  const selectedDate = rhfField.value ? parseISO(rhfField.value + '') : undefined;

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    const isoDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    onChange(isoDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={readonly}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
