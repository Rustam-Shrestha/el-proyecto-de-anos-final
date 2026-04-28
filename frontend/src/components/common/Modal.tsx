// @ts-nocheck
/**
 * Modal Component — Memoized
 *
 * Wrapped in React.memo to prevent re-renders when parent state
 * changes but modal props haven't changed.
 */
import React, { memo } from "react";
import { CloseIcon } from "../../assets/data/icons";

const Modal = memo(({
  size = "xl",
  title,
  className = "bg-primary",
  description = "",
  onClose,
  zIndex = "z-[2147483647]",
  children,
}) => {
  // Mobile-first size map - on mobile (< 640px), all sizes use nearly full width
  // Sizes scale up on larger screens
  const sizeMap = {
    sm: { width: "min(95vw, 500px)", maxHeight: "90vh" },
    md: { width: "min(95vw, 650px)", maxHeight: "90vh" },
    lg: { width: "min(95vw, 800px)", maxHeight: "92vh" },
    xl: { width: "min(95vw, 1000px)", maxHeight: "92vh" },
    "2xl": { width: "min(95vw, 1200px)", maxHeight: "94vh" },
    xxl: { width: "min(95vw, 1200px)", maxHeight: "94vh" },
    xxxl: { width: "min(96vw, 1400px)", maxHeight: "95vh" },
    "4xl": { width: "min(97vw, 1600px)", maxHeight: "96vh" },
    xxxxl: { width: "min(97vw, 1600px)", maxHeight: "96vh" },
    full: { width: "calc(100vw - 2%)", maxHeight: "calc(100vh - 2%)" },
  };

  const selectedSize = (size && sizeMap[size]) ? sizeMap[size] : (sizeMap["xl"] || { width: "min(95vw, 1000px)", maxHeight: "90vh" });
  const sizeClasses = {
    sm: "max-w-[500px] max-h-[90vh]",
    md: "max-w-[650px] max-h-[90vh]",
    lg: "max-w-[800px] max-h-[92vh]",
    xl: "max-w-[1000px] max-h-[92vh]",
    "2xl": "max-w-[1200px] max-h-[94vh]",
    xxl: "max-w-[1200px] max-h-[94vh]",
    xxxl: "max-w-[1400px] max-h-[95vh]",
    "4xl": "max-w-[1600px] max-h-[96vh]",
    xxxxl: "max-w-[1600px] max-h-[96vh]",
    full: "w-[98vw] max-h-[98vh]"
  };
  const selectedSizeClass = sizeClasses[size] || sizeClasses.xl;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-opacity-50 ${zIndex} p-2 sm:p-4 overflow-hidden`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 text-black dark:text-gray-100 flex flex-col overflow-hidden w-full min-w-0 ${selectedSizeClass}`}
      >
        {/* Header - Fixed */}
        <div
          className={`flex justify-between items-center ${className} text-base sm:text-lg font-medium text-white font-sans p-2 sm:p-3 rounded-t-lg flex-shrink-0`}
        >
          <div className="w-full min-w-0">
            <h2 className="truncate text-sm sm:text-lg">{title}</h2>
            {description && <p className="text-[10px] sm:text-xs truncate">{description}</p>}
          </div>
          <button
            onClick={onClose}
            title="Close modal"
            aria-label="Close modal"
            className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 min-w-0 w-full">
          {children}
        </div>
      </div>
    </div>
  );
});

export default Modal;

