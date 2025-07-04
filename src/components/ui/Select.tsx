import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <SelectTrigger onClick={() => setIsOpen(!isOpen)} isOpen={isOpen}>
        <SelectValue value={value} placeholder={placeholder} />
      </SelectTrigger>
      {isOpen && (
        <SelectContent onSelect={handleSelect}>
          {children}
        </SelectContent>
      )}
    </div>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  onClick: () => void;
  isOpen: boolean;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, onClick, isOpen }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between"
    >
      {children}
      <ChevronDown className={clsx('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
    </button>
  );
};

interface SelectValueProps {
  value: string;
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ value, placeholder }) => {
  return (
    <span className={clsx('text-left', !value && 'text-gray-500')}>
      {value || placeholder}
    </span>
  );
};

interface SelectContentProps {
  children: React.ReactNode;
  onSelect: (value: string) => void;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, onSelect }) => {
  const childCount = React.Children.count(children);
  const maxHeight = Math.min(childCount * 40, 200); // Show 5 items without scrolling (40px each)
  
  return (
    <div 
      className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-auto animate-fade-in"
      style={{ maxHeight: `${maxHeight}px` }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onSelect } as any);
        }
        return child;
      })}
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  onSelect?: (value: string) => void;
}

export const SelectItem: React.FC<SelectItemProps> = ({ children, value, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
    >
      {children}
    </button>
  );
};