"use client";

import {
  CalendarBody,
  CalendarDate,
  CalendarDatePagination,
  CalendarDatePicker,
  CalendarHeader,
  CalendarItem,
  CalendarMonthPicker,
  CalendarProvider,
  CalendarYearPicker,
} from "@/components/ui/calendar";
import type { FC } from "react";
import {
  addMonths,
  endOfMonth,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";

const today = new Date();

const exampleStatuses = [
  { id: "1", name: "Planned", color: "#6B7280" },
  { id: "2", name: "In Progress", color: "#F59E0B" },
  { id: "3", name: "Done", color: "#10B981" },
];

const exampleFeatures = [
  {
    id: "1",
    name: "Family Photos Upload",
    startAt: startOfMonth(subMonths(today, 2)),
    endAt: subDays(endOfMonth(today), 15),
    status: exampleStatuses[0],
  },
  {
    id: "2",
    name: "Shopping List Sync",
    startAt: startOfMonth(subMonths(today, 1)),
    endAt: subDays(endOfMonth(today), 10),
    status: exampleStatuses[1],
  },
  {
    id: "3",
    name: "Event Planning Tool",
    startAt: startOfMonth(subMonths(today, 1)),
    endAt: subDays(endOfMonth(today), 5),
    status: exampleStatuses[2],
  },
  {
    id: "4",
    name: "Family Calendar Integration",
    startAt: startOfMonth(today),
    endAt: endOfMonth(addMonths(today, 1)),
    status: exampleStatuses[0],
  },
  {
    id: "5",
    name: "Shared Document Library",
    startAt: startOfMonth(addMonths(today, 1)),
    endAt: endOfMonth(addMonths(today, 2)),
    status: exampleStatuses[1],
  },
  {
    id: "6",
    name: "Task Assignment System",
    startAt: startOfMonth(addMonths(today, 1)),
    endAt: endOfMonth(addMonths(today, 2)),
    status: exampleStatuses[2],
  },
  {
    id: "7",
    name: "Location Sharing",
    startAt: startOfMonth(addMonths(today, 2)),
    endAt: endOfMonth(addMonths(today, 3)),
    status: exampleStatuses[0],
  },
  {
    id: "8",
    name: "Family Budget Tracker",
    startAt: startOfMonth(addMonths(today, 3)),
    endAt: endOfMonth(addMonths(today, 4)),
    status: exampleStatuses[1],
  },
];

const earliestYear =
  exampleFeatures
    .map((feature) => feature.startAt.getFullYear())
    .sort()
    .at(0) ?? new Date().getFullYear();

const latestYear =
  exampleFeatures
    .map((feature) => feature.endAt.getFullYear())
    .sort()
    .at(-1) ?? new Date().getFullYear();

const CalendarDemo: FC = () => (
  <div className="min-h-screen bg-background p-8">
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Family OS Calendar</h1>
        <p className="text-muted-foreground">
          Advanced calendar component with feature tracking and date navigation
        </p>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <CalendarProvider>
          <CalendarDate>
            <CalendarDatePicker>
              <CalendarMonthPicker />
              <CalendarYearPicker start={earliestYear} end={latestYear} />
            </CalendarDatePicker>
            <CalendarDatePagination />
          </CalendarDate>
          <CalendarHeader />
          <CalendarBody features={exampleFeatures}>
            {({ feature }) => <CalendarItem key={feature.id} feature={feature} />}
          </CalendarBody>
        </CalendarProvider>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Feature Status Legend</h2>
        <div className="flex gap-4">
          {exampleStatuses.map((status) => (
            <div key={status.id} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-sm">{status.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default CalendarDemo; 