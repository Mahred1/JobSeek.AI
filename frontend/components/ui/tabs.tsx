"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const TabsContext = React.createContext<{
  selectedValue: string;
  onChange: (value: string) => void;
} | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

const Tabs = ({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
  ...props
}: TabsProps) => {
  // Internal state for uncontrolled mode
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value !== undefined ? value : internalValue;
  
  // Handler that calls the external handler in controlled mode
  // or updates internal state in uncontrolled mode
  const handleValueChange = React.useCallback((newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  }, [onValueChange]);

  const contextValue = React.useMemo(
    () => ({
      selectedValue,
      onChange: handleValueChange,
    }),
    [selectedValue, handleValueChange]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TabsList = ({ className, children, ...props }: TabsListProps) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-gray-100 p-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

const TabsTrigger = ({
  className,
  value,
  children,
  ...props
}: TabsTriggerProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }

  const { selectedValue, onChange } = context;
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "bg-white text-blue-700 shadow-sm"
          : "text-gray-700 hover:text-blue-700",
        className
      )}
      onClick={() => onChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const TabsContent = ({
  className,
  value,
  children,
  ...props
}: TabsContentProps) => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }

  const { selectedValue } = context;
  const isSelected = selectedValue === value;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 