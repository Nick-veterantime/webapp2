import { format } from 'date-fns';
import { useState } from 'react';

interface SeparationDateInputProps {
  separationDate: Date;
  onDateChange: (date: Date) => void;
}

export function SeparationDateInput({ separationDate, onDateChange }: SeparationDateInputProps) {
  const [month, setMonth] = useState(separationDate.getMonth());
  const [year, setYear] = useState(separationDate.getFullYear());
  const [day, setDay] = useState(separationDate.getDate());

  // Generate years (current year + 5 years)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);
  
  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setMonth(newMonth);
    const newDate = new Date(year, newMonth, day);
    onDateChange(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setYear(newYear);
    const newDate = new Date(newYear, month, day);
    onDateChange(newDate);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDay = parseInt(e.target.value);
    setDay(newDay);
    const newDate = new Date(year, month, newDay);
    onDateChange(newDate);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <select 
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
          value={year}
          onChange={handleYearChange}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div>
        <select 
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
          value={month}
          onChange={handleMonthChange}
        >
          {months.map((month, index) => (
            <option key={month} value={index}>{month}</option>
          ))}
        </select>
      </div>
      <div>
        <select 
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
          value={day}
          onChange={handleDayChange}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>
    </div>
  );
} 