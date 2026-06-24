"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { calculateAge, formatLocalDate } from "@/lib/utils/kid/childAge";

interface KidDobInputProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined, error: string | null) => void;
  localAgeError: string | null;
  variant: "onboarding" | "settings";
}

export default function KidDobInput({
  date,
  onDateChange,
  localAgeError,
  variant,
}: KidDobInputProps) {
  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onDateChange(undefined, variant === "settings" ? "Birthdate is required." : null);
      return;
    }

    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    if (selectedDateOnly > todayDateOnly) {
      onDateChange(selectedDate, "Birthdate cannot be in the future.");
      return;
    }

    const age = calculateAge(selectedDateOnly, todayDateOnly);
    if (age === null || age < 5) {
      onDateChange(selectedDate, "You must be at least 5 years old.");
    } else if (age > 25) {
      onDateChange(selectedDate, "You must be at most 25 years old.");
    } else {
      onDateChange(selectedDate, null);
    }
  };

  if (variant === "onboarding") {
    return (
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="text-sm font-bold text-foreground ml-1">
          Birthdate<span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/50 z-10" />
          <Popover>
            <PopoverTrigger
              type="button"
              className="w-full h-12 rounded-2xl border-2 border-border pl-11 justify-start text-left text-base font-medium bg-background text-foreground hover:bg-background hover:text-foreground focus:border-sky-500 focus:ring-0 flex items-center"
            >
              {date ? (
                format(date, "PPP")
              ) : (
                <span className="text-muted-foreground/50">Pick your birthday</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                captionLayout="dropdown"
                startMonth={new Date(new Date().getFullYear() - 100, 0)}
                endMonth={new Date()}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
          <input type="hidden" name="dateOfBirth" value={date ? formatLocalDate(date) : ""} />
        </div>
        {localAgeError && (
          <p className="text-xs font-bold text-rose-500 ml-1 mt-1">{localAgeError}</p>
        )}
      </div>
    );
  }

  // settings variant
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="dateOfBirth" className="text-sm font-bold text-foreground ml-1">
        Date of Birth
      </Label>
      <div className="relative">
        <Popover>
          <PopoverTrigger
            type="button"
            id="dateOfBirth"
            className="w-full rounded-2xl border border-input bg-background focus:bg-card h-13 text-base font-medium px-4 text-left justify-start flex items-center gap-2 hover:bg-background/90"
          >
            <CalendarIcon className="h-5 w-5 text-muted-foreground/80 shrink-0" />
            {date ? (
              format(date, "PPP")
            ) : (
              <span className="text-muted-foreground/50">Pick your birthday</span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              captionLayout="dropdown"
              startMonth={new Date(new Date().getFullYear() - 100, 0)}
              endMonth={new Date()}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {localAgeError && (
        <p className="text-xs font-bold text-rose-500 ml-1 mt-1">{localAgeError}</p>
      )}
    </div>
  );
}
