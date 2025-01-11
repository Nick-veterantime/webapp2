import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format, getYear } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';

interface SeparationDateInputProps {
  onDateChange: (date: Date) => void;
  separationDate: Date;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
] as const;

type Month = (typeof months)[number];

export function SeparationDateInput({ onDateChange, separationDate }: SeparationDateInputProps) {
  const currentYear = getYear(new Date());
  const [selectedDay, setSelectedDay] = useState(separationDate.getDate().toString().padStart(2, '0'));
  const [selectedMonth, setSelectedMonth] = useState(months[separationDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(separationDate.getFullYear());

  const updateDate = (day: string, month: Month, year: number) => {
    const monthIndex = months.indexOf(month);
    const newDate = new Date(year, monthIndex, parseInt(day));
    onDateChange(newDate);
  };

  // Get days centered around selected day
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const selectedDayIndex = days.indexOf(selectedDay);
  const displayDays = days.slice(Math.max(0, selectedDayIndex - 3), Math.min(days.length, selectedDayIndex + 4));

  // Get years (current year + 29 more years, for 30 total)
  const years = Array.from({ length: 30 }, (_, i) => currentYear + i);
  const selectedYearIndex = years.indexOf(selectedYear);
  const displayYears = years.slice(Math.max(0, selectedYearIndex - 3), Math.min(years.length, selectedYearIndex + 4));

  // Get months centered around selected month
  const selectedMonthIndex = months.indexOf(selectedMonth);
  const displayMonths = Array.from(months.slice(Math.max(0, selectedMonthIndex - 3), Math.min(months.length, selectedMonthIndex + 4)));

  return (
    <div className="absolute top-4 right-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="pl-3 text-left font-normal bg-[#2C2E33] border-gray-700 text-gray-200 hover:bg-[#34373C] text-lg flex items-center gap-2"
          >
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-400">Separation Date:</span>
            <span>{format(separationDate, 'MMMM do, yyyy')}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[240px] p-0" 
          align="end"
          sideOffset={8}
          style={{
            backgroundColor: '#1E1F23',
            border: '1px solid #2C2E33',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex flex-col">
            {/* Label */}
            <div className="px-3 py-2 border-b border-[#2C2E33]">
              <span className="text-gray-400 text-sm">Separation Date</span>
            </div>
            {/* Picker Container */}
            <div className="flex justify-between px-3 py-2">
              {/* Year Column */}
              <div className="w-1/3">
                <div className="flex flex-col items-center">
                  {displayYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        updateDate(selectedDay, selectedMonth, year);
                      }}
                      className="w-full py-2 text-center relative group"
                    >
                      <span className={`${selectedYear === year ? 'text-white font-medium' : 'text-gray-400'} group-hover:text-white`}>
                        {year}
                      </span>
                      {selectedYear === year && (
                        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Month Column */}
              <div className="w-1/3">
                <div className="flex flex-col items-center">
                  {displayMonths.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setSelectedMonth(month);
                        updateDate(selectedDay, month, selectedYear);
                      }}
                      className="w-full py-2 text-center relative group"
                    >
                      <span className={`${selectedMonth === month ? 'text-white font-medium' : 'text-gray-400'} group-hover:text-white`}>
                        {month}
                      </span>
                      {selectedMonth === month && (
                        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              {/* Day Column */}
              <div className="w-1/3">
                <div className="flex flex-col items-center">
                  {displayDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDay(day);
                        updateDate(day, selectedMonth, selectedYear);
                      }}
                      className="w-full py-2 text-center relative group"
                    >
                      <span className={`${selectedDay === day ? 'text-white font-medium' : 'text-gray-400'} group-hover:text-white`}>
                        {day}
                      </span>
                      {selectedDay === day && (
                        <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex border-t border-[#2C2E33]">
              <button
                onClick={() => onDateChange(separationDate)}
                className="flex-1 p-2 text-gray-400 hover:text-gray-200 transition-colors border-r border-[#2C2E33] text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateDate(selectedDay, selectedMonth, selectedYear);
                }}
                className="flex-1 p-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 