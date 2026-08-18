"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

type DateRangePickerProps = {
  className?: string;
  disabled?: boolean;
  numberOfMonths?: number;
  onChange: (value: DateRange | undefined) => void;
  onPresetChange?: (value: string) => void;
  placeholder?: string;
  presets?: DateRangePickerPreset[];
  selectedPreset?: string;
  value?: DateRange;
};

type DateRangePickerPreset = {
  label: string;
  range?: DateRange;
  value: string;
};

function DateRangePicker({
  className,
  disabled,
  numberOfMonths = 1,
  onChange,
  onPresetChange,
  placeholder = "选择日期范围",
  presets = [],
  selectedPreset,
  value,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            className={cn(
              "w-full justify-start px-3 font-normal",
              !value?.from && "text-muted-foreground",
              className,
            )}
            disabled={disabled}
            type="button"
            variant="outline"
          >
            <CalendarDays className="text-muted-foreground" />
            {value?.from ? (
              value.to ? (
                <span>
                  {format(value.from, "yyyy-MM-dd")} 至{" "}
                  {format(value.to, "yyyy-MM-dd")}
                </span>
              ) : (
                <span>{format(value.from, "yyyy-MM-dd")} 至 …</span>
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-col sm:flex-row">
          {presets.length > 0 ? (
            <div className="grid grid-cols-3 content-start gap-1 border-b border-border p-2 sm:min-w-28 sm:grid-cols-1 sm:border-r sm:border-b-0">
              {presets.map((preset) => (
                <Button
                  className={cn(
                    "justify-start px-2 text-xs font-normal",
                    preset.value === selectedPreset &&
                      "bg-accent text-accent-foreground",
                  )}
                  key={preset.value}
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    onChange(preset.range);
                    onPresetChange?.(preset.value);
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          ) : null}
          <Calendar
            defaultMonth={value?.from}
            locale={zhCN}
            mode="range"
            numberOfMonths={numberOfMonths}
            selected={value}
            onSelect={onChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateRangePicker };
export type { DateRange, DateRangePickerPreset, DateRangePickerProps };
