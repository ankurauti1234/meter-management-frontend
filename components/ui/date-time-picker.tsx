"use client";

import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { Card, CardContent, CardFooter } from "./card";
import { Separator } from "./separator";

export interface DateTime {
  date?: Date;
  time?: string;
}

interface DateTimePickerProps {
  value: DateTime;
  onChange: (value: DateTime) => void;
  label: string;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = "Pick date & time",
}: DateTimePickerProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value.date
              ? `${format(value.date, "PP")} ${value.time || ""}`
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Card className="border-0 p-0 gap-0">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={value.date}
                onSelect={(d) => onChange({ ...value, date: d })}
              />
            </CardContent>
            <Separator/>
            <CardFooter className=" p-2">
              <div className="flex w-full items-center gap-2">
                {/* <Clock2 className="h-4 w-4 text-muted-foreground" /> */}
                <Input
                  type="time"
                  step="1"
                  value={value.time || ""}
                  onChange={(e) =>
                    onChange({ ...value, time: e.target.value })
                  }
                  className="h-9"
                />
              </div>
            </CardFooter>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}