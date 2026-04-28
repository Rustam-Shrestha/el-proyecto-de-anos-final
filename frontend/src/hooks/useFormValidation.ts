// @ts-nocheck
import { useState } from "react";

export const useFormValidation = (initialState, validationRules) => {
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return true;

    let isValid = true;
    let errorMessage = "";

    for (const rule of rules) {
      if (rule.required && !value) {
        errorMessage = rule.message || "This field is required";
        isValid = false;
        break;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errorMessage = rule.message || "Invalid format";
        isValid = false;
        break;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errorMessage =
          rule.message || `Minimum ${rule.minLength} characters required`;
        isValid = false;
        break;
      }

      if (rule.validate && typeof rule.validate === "function") {
        const customError = rule.validate(value);
        if (customError) {
          errorMessage = customError;
          isValid = false;
          break;
        }
      }
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: isValid ? undefined : errorMessage,
    }));

    return isValid;
  };

  const validateForm = (formData) => {
    let isValid = true;

    for (const field in validationRules) {
      const value = formData[field];
      const fieldValid = validateField(field, value);
      if (!fieldValid) isValid = false;
    }

    return isValid;
  };

  const handleChangeWithValidation = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
    return { name, value };
  };

  return {
    errors,
    validateField,
    validateForm,
    handleChangeWithValidation,
    setErrors,
  };
};
