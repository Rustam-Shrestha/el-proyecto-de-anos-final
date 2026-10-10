import React, { useState } from 'react';
import SelectField from './SelectField';
import Button from './Button';
import { FilterIcon } from '@/shared/icons';

export interface FilterConfig {
  key: string;
  label: string;
  options: (string | { value: string; label: string })[];
}

export interface FilterBarProps {
  filters: FilterConfig[];
  onApplyFilters: (filterValues: Record<string, string>) => void;
  onReset?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onApplyFilters,
  onReset,
  className = '',
}) => {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    const updated = { ...selectedFilters, [key]: value };
    setSelectedFilters(updated);
    onApplyFilters(updated);
  };

  const handleReset = () => {
    setSelectedFilters({});
    onReset?.();
    onApplyFilters({});
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mr-2">
        <FilterIcon className="size-4 text-gray-500" />
        <span>Filters:</span>
      </div>
      {filters.map((filter) => {
        const formattedOptions = filter.options.map((opt) =>
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        );
        return (
          <div key={filter.key} className="w-48">
            <SelectField
              placeholder={`All ${filter.label}`}
              options={formattedOptions}
              value={selectedFilters[filter.key] || ''}
              onChange={(val) => handleFilterChange(filter.key, val)}
            />
          </div>
        );
      })}
      {Object.keys(selectedFilters).length > 0 && (
        <Button variant="secondary" size="sm" onClick={handleReset}>
          Reset
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
