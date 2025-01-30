'use client';

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { getLocalISOString } from '@/utils/dates';

interface DateContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  weekOffset: number;
  setWeekOffset: Dispatch<SetStateAction<number>>;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return getLocalISOString(today);
  });

  const [weekOffset, setWeekOffset] = useState(0);

  return (
    <DateContext.Provider 
      value={{ 
        selectedDate, 
        setSelectedDate,
        weekOffset,
        setWeekOffset
      }}
    >
      {children}
    </DateContext.Provider>
  );
}

export function useDateContext() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateContext must be used within a DateProvider');
  }
  return context;
}