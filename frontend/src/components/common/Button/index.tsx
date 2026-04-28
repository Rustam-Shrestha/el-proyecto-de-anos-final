// @ts-nocheck
// import React from "react";
// import { PlusIcon } from "../../../assets/data/icons";

// const Button = ({ onClick, label }) => {
//   return (
//     <button
//       className="text-white font-medium py-2 px-2 flex items-center rounded  border-none"
//       onClick={onClick}
//     >
//       {label && <PlusIcon />}
//       <span>{label}</span>
//     </button>
//   );
// };

// const PrimaryButton = ({ onClick, label, type, icon }) => {
//   return (
//     <button
//       type={type}
//       className="text-white text-sm bg-primary font-medium py-2 px-2 flex items-center rounded  border-none"
//       onClick={onClick}
//     >
//       {icon && icon}
//       <span className="ml-2">{label}</span>
//     </button>
//   );
// };

// const SecondaryButton = ({ type = "submit", onClick, label, icon }) => {
//   return (
//     <button
//       type={type}
//       className="text-primary text-sm font-medium py-2 px-2 flex items-center rounded border-2 border-primary"
//       onClick={onClick}
//     >
//       {icon && icon}
//       <span className="ml-2">{label}</span>
//     </button>
//   );
// };

// const OutlineButton = ({ label, type = "submit", onClick, icon }) => {
//   return (
//     <button
//     type={type}
//     className="text-[#1F2635] text-sm font-medium py-2 px-2 flex items-center rounded border-2 border-[#D0D5DD]"
//     onClick={onClick}
//   >
//     {icon && icon}
//     <span className="ml-2">{label}</span>
//   </button>
//   );
// };

// export { Button, PrimaryButton, SecondaryButton, OutlineButton };

import { useRef } from "react";
import { CircularLoader } from "../SkletonLoader";

// Common Button Component
const Button = ({
  onClick,
  label,
  type = "button",
  icon: Icon,
  variant = "primary", // 'primary', 'secondary', 'outline'
  iconPosition = "left", // 'left', 'right'
  className = "", // Custom className
  loading = false,
}) => {
  const buttonClasses = {
    primary: "text-white bg-primary border-none",
    danger: "text-white bg-red",
    secondary: "text-primary border-2 border-primary",
    outline: "text-[#1F2635] border-2 border-[#D0D5DD]",
  };

  const iconElement = Icon ? <Icon /> : null;
  const buttonTitle = typeof label === "string" && label.trim() ? label : "Action button";
  const content =
    label && iconPosition === "left" ? (
      <>
        {iconElement}
        <span className="ml-1">{label}</span>
      </>
    ) : (
      <>
        <span>{label}</span>
        {iconElement}
      </>
    );

  return (
    <button
      type={type}
      title={buttonTitle}
      aria-label={buttonTitle}
      className={`text-sm font-medium py-2 px-8 flex items-center rounded-lg ${buttonClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {loading ? <CircularLoader variant="primary" /> : content}
      {/* {content} */}
    </button>
  );
};

const FileUpload = ({
  onFileSelect,
  label,
  type = "file",
  icon: Icon,
  variant = "primary", // 'primary', 'secondary', 'outline'
  iconPosition = "left", // 'left', 'right'
  className = "", // Custom className
  loading = false,
}) => {
  const fileInputRef = useRef(null); // Create a reference for the file input field

  const handleFileClick = () => {
    // Trigger the file input click event programmatically
    fileInputRef.current.click();
  };

  const buttonClasses = {
    primary: "text-white bg-primary border-none",
    secondary: "text-primary border-2 border-primary",
    outline: "text-primary border-[1px] border-[#D0D5DD] rounded-lg",
  };

  const iconElement = Icon ? <Icon /> : null;
  const content =
    label && iconPosition === "left" ? (
      <>
        {iconElement}
        <span className="ml-1">{label}</span>
      </>
    ) : (
      <>
        <span>{label}</span>
        {iconElement}
      </>
    );

  return (
    <div
      onClick={handleFileClick}
      title={typeof label === "string" && label.trim() ? label : "Upload file"}
      aria-label={typeof label === "string" && label.trim() ? label : "Upload file"}
      className={`cursor-pointer py-2 px-4 flex items-center text-sm font-medium  ${buttonClasses[variant]} ${className}`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef} // Attach the ref
        type={type}
        className="hidden" // Hide the input
        aria-label={typeof label === "string" && label.trim() ? label : "File upload input"}
        onChange={onFileSelect} // Trigger when a file is selected
      />
      {loading ? <CircularLoader variant="secondary" /> : content}
    </div>
  );
};

// Exporting default Button with different variants for flexibility
const PrimaryButton = (props) => <Button {...props} variant="primary" />;
const DangerButton = (props) => <Button {...props} variant="danger" />;

const SecondaryButton = (props) => <Button {...props} variant="secondary" />;
const OutlineButton = (props) => <Button {...props} variant="outline" />;
const FileUploadButton = (props) => <FileUpload {...props} variant="outline" />;

export {
  Button,
  DangerButton,
  FileUploadButton,
  OutlineButton,
  PrimaryButton,
  SecondaryButton,
};