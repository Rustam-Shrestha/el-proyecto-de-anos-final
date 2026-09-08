// @ts-nocheck
/**
 * SelectField Component — Refactored
 *
 * CHANGES:
 * - Replaced manual click-outside with reusable useClickOutside hook
 * - Wrapped in React.memo for performance
 * - Same visual behavior as before
 */
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { DownArrow } from "../../../assets/data/icons";
import useClickOutside from "../../../hooks/useClickOutside";

const CustomSelectField = memo(({
  label,
  placeholder = "Select option",
  value,
  onChange,
  error,
  options = [],
  className = "",
  disabled = false,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef(null);
  const selectRef = useRef(null);

  // Reusable hook replaces manual click-outside pattern
  const dropdownRef = useClickOutside(() => {
    setIsOpen(false);
    setSearchTerm("");
  });

  const getOptionLabel = useCallback(
    (val) => {
      const found = options.find((opt) => (opt.value || opt) === val);
      return found?.label || found || "";
    },
    [options]
  );

  const filteredOptions = options.filter((option) =>
    (option.label || option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (selected) => {
    const val = selected.value || selected;
    const label = getOptionLabel(val);

    // Update display and search
    setDisplayValue(label);
    setSearchTerm("");
    setIsOpen(false);

    // Call onChange directly with proper event structure
    if (onChange && selectRef.current) {
      selectRef.current.value = val;
      // Create a proper synthetic event object that matches what React expects
      const syntheticEvent = {
        target: {
          name: selectRef.current.name,
          value: val
        },
        currentTarget: {
          name: selectRef.current.name,
          value: val
        }
      };
      onChange(syntheticEvent);
    }
  };

  useEffect(() => {
    const selectedLabel = getOptionLabel(value);
    setDisplayValue(selectedLabel);
  }, [value, options, getOptionLabel]);

  const handleInputClick = (_e) => {
    if (disabled) {
      return;
    }

    if (isOpen) {
      setIsOpen(false);
      setSearchTerm("");
    } else {
      setIsOpen(true);
      setSearchTerm("");
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e) => {
    if (disabled) {
      return;
    }

    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  // Click-outside handling is now done by useClickOutside hook above

  return (
    <div className={`flex flex-col w-full ${className} ${disabled ? "pointer-events-none opacity-75" : ""}`.trim()} ref={dropdownRef}>
      {label && (
        <label className="text-sm font-medium text-[#0F172A] mb-2">{label}</label>
      )}

      <div className="relative w-full">
        {/* Hidden native select for compatibility */}
        <select
          ref={selectRef}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="hidden"
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, _index) => (
            <option
              key={_index}
              value={option.value || option}
              id={option.label || option}
            >
              {option.label || option}
            </option>
          ))}
        </select>

        {/* Custom input styled as select */}
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
          <DownArrow />
        </div>

        {isOpen && (
          <div className="absolute w-full mt-1 bg-white shadow-card border border-[#E2E8F0] rounded-[8px] z-50 max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const val = option.value || option;
                const label = option.label || option;
                const isSelected = value === val;

                return (
                  <div
                    key={index}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      isSelected
                        ? "bg-gray-100 font-medium text-primary"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {label}
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

export default CustomSelectField;
