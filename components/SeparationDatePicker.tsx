import React from 'react';
import { format } from 'date-fns';

interface SeparationDatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SeparationDatePicker({ date, onChange, onNext, onBack }: SeparationDatePickerProps) {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold">
          When is your separation date?
        </h2>
        <p className="text-gray-300">
          This helps us create a personalized timeline for your transition.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Year Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Year</label>
          <select
            className="w-full p-3 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-200 appearance-none"
            value={date.getFullYear()}
            onChange={(e) => {
              const newDate = new Date(date);
              newDate.setFullYear(parseInt(e.target.value));
              onChange(newDate);
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Month</label>
          <select
            className="w-full p-3 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-200 appearance-none"
            value={date.getMonth()}
            onChange={(e) => {
              const newDate = new Date(date);
              newDate.setMonth(parseInt(e.target.value));
              onChange(newDate);
            }}
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
        </div>

        {/* Day Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-400">Day</label>
          <select
            className="w-full p-3 bg-[#1E1E1E] border border-gray-700 rounded-lg text-gray-200 appearance-none"
            value={date.getDate()}
            onChange={(e) => {
              const newDate = new Date(date);
              newDate.setDate(parseInt(e.target.value));
              onChange(newDate);
            }}
          >
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
} 