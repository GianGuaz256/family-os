'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getDay, getDaysInMonth, isSameDay } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { type ReactNode, createContext, useContext, useState } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type CalendarState = {
  month: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  year: number;
  selectedDate: Date | null;
  setMonth: (month: CalendarState['month']) => void;
  setYear: (year: CalendarState['year']) => void;
  setSelectedDate: (date: Date | null) => void;
};

export const useCalendar = create<CalendarState>()(
  devtools((set) => ({
    month: new Date().getMonth() as CalendarState['month'],
    year: new Date().getFullYear(),
    selectedDate: new Date(),
    setMonth: (month: CalendarState['month']) => set(() => ({ month })),
    setYear: (year: CalendarState['year']) => set(() => ({ year })),
    setSelectedDate: (selectedDate: Date | null) => set(() => ({ selectedDate })),
  }))
);

type CalendarContextProps = {
  locale: Intl.LocalesArgument;
  startDay: number;
};

const CalendarContext = createContext<CalendarContextProps>({
  locale: 'en-US',
  startDay: 0,
});

export type Status = {
  id: string;
  name: string;
  color: string;
};

export type Feature = {
  id: string;
  name: string;
  startAt: Date;
  endAt: Date;
  status: Status;
};

type ComboboxProps = {
  value: string;
  setValue: (value: string) => void;
  data: {
    value: string;
    label: string;
  }[];
  labels: {
    button: string;
    empty: string;
    search: string;
  };
  className?: string;
};

export const monthsForLocale = (
  localeName: Intl.LocalesArgument,
  monthFormat: Intl.DateTimeFormatOptions['month'] = 'long'
) => {
  const format = new Intl.DateTimeFormat(localeName, { month: monthFormat })
    .format;

  return Array.from({ length: 12 }, (_, m) =>
    format(new Date(Date.UTC(2021, m % 12)))
  );
};

export const daysForLocale = (locale: Intl.LocalesArgument, startDay: number) => {
  const weekdays: string[] = [];
  const baseDate = new Date(2024, 0, startDay);

  for (let i = 0; i < 7; i++) {
    weekdays.push(
      new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(baseDate)
    );
    baseDate.setDate(baseDate.getDate() + 1);
  }

  return weekdays;
};

const Combobox = ({
  value,
  setValue,
  data,
  labels,
  className,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn('min-w-0 justify-between capitalize text-sm', className)}
        >
          <span className="truncate">
            {value
              ? data.find((item) => item.value === value)?.label
              : labels.button}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[120px] p-0">
        <Command
          filter={(value, search) => {
            const label = data.find((item) => item.value === value)?.label;

            return label?.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue);
                    setOpen(false);
                  }}
                  className="capitalize"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type OutOfBoundsDayProps = {
  day: number;
};

const OutOfBoundsDay = ({ day }: OutOfBoundsDayProps) => (
  <div className="relative h-full w-full bg-secondary p-1 text-muted-foreground text-xs">
    {day}
  </div>
);

export type CalendarBodyProps = {
  features: Feature[];
  children: (props: {
    feature: Feature;
  }) => ReactNode;
  onDateSelect?: (date: Date) => void;
};

export const CalendarBody = ({ features, children, onDateSelect }: CalendarBodyProps) => {
  const { month, year, selectedDate, setSelectedDate } = useCalendar();
  const { startDay } = useContext(CalendarContext);
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));
  const firstDay = (getDay(new Date(year, month, 1)) - startDay + 7) % 7;
  const days: ReactNode[] = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(new Date(prevMonthYear, prevMonth, 1));
  const prevMonthDaysArray = Array.from(
    { length: prevMonthDays },
    (_, i) => i + 1
  );

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDaysArray[prevMonthDays - firstDay + i];

    if (day) {
      days.push(<OutOfBoundsDay key={`prev-${i}`} day={day} />);
    }
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const isSelected = selectedDate && isSameDay(currentDate, selectedDate);
    const isToday = isSameDay(currentDate, new Date());
    
    const featuresForDay = features.filter((feature) => {
      return isSameDay(new Date(feature.endAt), currentDate) || 
             isSameDay(new Date(feature.startAt), currentDate) ||
             (currentDate >= new Date(feature.startAt) && currentDate <= new Date(feature.endAt));
    });

    const handleDateClick = () => {
      setSelectedDate(currentDate);
      if (onDateSelect) {
        onDateSelect(currentDate);
      }
    };

    days.push(
      <button
        key={day}
        onClick={handleDateClick}
        className={cn(
          "relative flex h-full w-full flex-col gap-0.5 p-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors min-w-0",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
          isToday && !isSelected && "bg-accent text-accent-foreground font-semibold",
          !isSelected && !isToday && "text-muted-foreground"
        )}
      >
        <span className="text-left text-sm font-medium">{day}</span>
        <div className="flex-1 flex flex-col gap-0.5 min-w-0 overflow-hidden">
          {featuresForDay.slice(0, 2).map((feature) => (
            <div key={feature.id}>
              {children({ feature })}
            </div>
          ))}
        </div>
        {featuresForDay.length > 2 && (
          <span className="block text-muted-foreground text-xs leading-none mt-auto">
            +{featuresForDay.length - 2}
          </span>
        )}
      </button>
    );
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextMonthYear = month === 11 ? year + 1 : year;
  const nextMonthDays = getDaysInMonth(new Date(nextMonthYear, nextMonth, 1));
  const nextMonthDaysArray = Array.from(
    { length: nextMonthDays },
    (_, i) => i + 1
  );

  const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
  if (remainingDays < 7) {
    for (let i = 0; i < remainingDays; i++) {
      const day = nextMonthDaysArray[i];

      if (day) {
        days.push(<OutOfBoundsDay key={`next-${i}`} day={day} />);
      }
    }
  }

  return (
    <div className="grid flex-grow grid-cols-7 min-h-0">
      {days.map((day, index) => (
        <div
          key={index}
          className={cn(
            'relative min-h-[60px] sm:min-h-[70px] md:min-h-[80px] overflow-hidden border-t border-r',
            index % 7 === 6 && 'border-r-0'
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarDatePickerProps = {
  className?: string;
  children: ReactNode;
};

export const CalendarDatePicker = ({
  className,
  children,
}: CalendarDatePickerProps) => (
  <div className={cn('flex items-center gap-1 sm:gap-2 min-w-0 flex-1', className)}>{children}</div>
);

export type CalendarMonthPickerProps = {
  className?: string;
};

export const CalendarMonthPicker = ({
  className,
}: CalendarMonthPickerProps) => {
  const { month, setMonth } = useCalendar();
  const { locale } = useContext(CalendarContext);

  return (
    <Combobox
      className={className}
      value={month.toString()}
      setValue={(value) =>
        setMonth(Number.parseInt(value) as CalendarState['month'])
      }
      data={monthsForLocale(locale).map((month, index) => ({
        value: index.toString(),
        label: month,
      }))}
      labels={{
        button: 'Select month',
        empty: 'No month found',
        search: 'Search month',
      }}
    />
  );
};

export type CalendarYearPickerProps = {
  className?: string;
  start: number;
  end: number;
};

export const CalendarYearPicker = ({
  className,
  start,
  end,
}: CalendarYearPickerProps) => {
  const { year, setYear } = useCalendar();

  return (
    <Combobox
      className={className}
      value={year.toString()}
      setValue={(value) => setYear(Number.parseInt(value))}
      data={Array.from({ length: end - start + 1 }, (_, i) => ({
        value: (start + i).toString(),
        label: (start + i).toString(),
      }))}
      labels={{
        button: 'Select year',
        empty: 'No year found',
        search: 'Search year',
      }}
    />
  );
};

export type CalendarDatePaginationProps = {
  className?: string;
};

export const CalendarDatePagination = ({
  className,
}: CalendarDatePaginationProps) => {
  const { month, year, setMonth, setYear } = useCalendar();

  const handlePreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth((month - 1) as CalendarState['month']);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth((month + 1) as CalendarState['month']);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button onClick={() => handlePreviousMonth()} variant="ghost" size="icon">
        <ChevronLeftIcon size={16} />
      </Button>
      <Button onClick={() => handleNextMonth()} variant="ghost" size="icon">
        <ChevronRightIcon size={16} />
      </Button>
    </div>
  );
};

export type CalendarDateProps = {
  children: ReactNode;
};

export const CalendarDate = ({ children }: CalendarDateProps) => (
  <div className="flex items-center justify-between p-2 sm:p-3 gap-2 min-w-0">{children}</div>
);

export type CalendarHeaderProps = {
  className?: string;
};

export const CalendarHeader = ({ className }: CalendarHeaderProps) => {
  const { locale, startDay } = useContext(CalendarContext);

  return (
    <div className={cn('grid grid-cols-7 border-b', className)}>
      {daysForLocale(locale, startDay).map((day) => (
        <div key={day} className="p-2 sm:p-3 text-center text-muted-foreground text-xs font-medium">
          {day}
        </div>
      ))}
    </div>
  );
};

export type CalendarItemProps = {
  feature: Feature;
  className?: string;
};

export const CalendarItem = ({ feature, className }: CalendarItemProps) => (
  <div className={cn('flex items-center gap-1 min-w-0', className)} key={feature.id}>
    <div
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{
        backgroundColor: feature.status.color,
      }}
    />
    <span className="truncate text-xs leading-tight">{feature.name}</span>
  </div>
);

export type CalendarProviderProps = {
  locale?: Intl.LocalesArgument;
  startDay?: number;
  children: ReactNode;
  className?: string;
};

export const CalendarProvider = ({
  locale = 'en-US',
  startDay = 0,
  children,
  className,
}: CalendarProviderProps) => (
  <CalendarContext.Provider value={{ locale, startDay }}>
    <div className={cn('relative flex flex-col', className)}>{children}</div>
  </CalendarContext.Provider>
);
