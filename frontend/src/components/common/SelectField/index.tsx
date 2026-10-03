import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import useClickOutside from "../../../hooks/useClickOutside";
import { ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string } | string;

export interface CustomSelectFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement> | { target: { name?: string; value: string }; currentTarget?: { name?: string; value: string } }) => void;
  error?: string;
  options?: SelectOption[];
  className?: string;
  disabled?: boolean;
  name?: string;
}

const CustomSelectField = memo(({
  label,
  placeholder = "Select option",
  value = "",
  onChange,
  error,
  options = [],
  className = "",
  disabled = false,
  ...rest
}: CustomSelectFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const dropdownRef = useClickOutside(() => {
    setIsOpen(false);
    setSearchTerm("");
  });

  const getOptionLabel = useCallback(
    (val: string) => {
      const found = options.find((opt) => (typeof opt === "string" ? opt : opt.value) === val);
      if (!found) return "";
      return typeof found === "string" ? found : found.label;
    },
    [options]
  );

  const filteredOptions = options.filter((option) => {
    const labelText = typeof option === "string" ? option : option.label;
    return labelText.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (selected: SelectOption) => {
    const val = typeof selected === "string" ? selected : selected.value;
    const lbl = getOptionLabel(val);

    setDisplayValue(lbl);
    setSearchTerm("");
    setIsOpen(false);

    if (onChange && selectRef.current) {
      selectRef.current.value = val;
      const syntheticEvent = {
        target: {
          name: selectRef.current.name,
          value: val,
        },
        currentTarget: {
          name: selectRef.current.name,
          value: val,
        },
      };
      onChange(syntheticEvent);
    }
  };

  useEffect(() => {
    const selectedLabel = getOptionLabel(value);
    setDisplayValue(selectedLabel);
  }, [value, options, getOptionLabel]);

  const handleInputClick = () => {
    if (disabled) return;

    if (isOpen) {
      setIsOpen(false);
      setSearchTerm("");
    } else {
      setIsOpen(true);
      setSearchTerm("");
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  return (
    <div className={`flex flex-col w-full ${className} ${disabled ? "pointer-events-none opacity-75" : ""}`.trim()} ref={dropdownRef as React.RefObject<HTMLDivElement>}>
      {label && (
        <label className="text-sm font-medium text-[#0F172A] mb-2">{label}</label>
      )}

      <div className="relative w-full">
        <select
          ref={selectRef}
          value={value}
          onChange={onChange as (e: ChangeEvent<HTMLSelectElement>) => void}
          disabled={disabled}
          className="hidden"
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, _index) => {
            const val = typeof option === "string" ? option : option.value;
            const lbl = typeof option === "string" ? option : option.label;
            return (
              <option key={_index} value={val} id={lbl}>
                {lbl}
              </option>
            );
          })}
        </select>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue || ""}
          placeholder={placeholder}
          onChange={handleInputChange}
          onClick={handleInputClick}
          readOnly={!isOpen}
          disabled={disabled}
          className="w-full h-10 text-sm text-[#0F172A] bg-white border border-[#CBD5E1] px-3 rounded-[6px] focus:outline-none focus:border-[#15803D] focus:ring-2 focus:ring-[rgba(21,128,61,0.12)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-[#F1F5F9]"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown className="h-4 w-4" />
        </div>

        {isOpen && (
          <div className="absolute w-full mt-1 bg-white shadow-card border border-[#E2E8F0] rounded-[8px] z-50 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const val = typeof option === "string" ? option : option.value;
                const lbl = typeof option === "string" ? option : option.label;
                const isSelected = value === val;

                return (
                  <div
                    key={index}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      isSelected
                        ? "bg-gray-100 font-medium text-[var(--green-icon)]"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {lbl}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-[#DC2626] text-sm mt-1">{error}</span>}
    </div>
  );
});

CustomSelectField.displayName = "CustomSelectField";

export default CustomSelectField;
