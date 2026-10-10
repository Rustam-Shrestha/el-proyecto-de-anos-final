import { useState, useCallback } from "react";

export interface FormValidationConfig<T extends Record<string, any>> {
  initialValues?: T;
  validationSchema?: any;
  onSubmit?: (values: T) => void | Promise<void>;
  rules?: Record<string, any[]>;
}

export const useFormValidation = <T extends Record<string, any> = Record<string, any>>(
  configOrInitialState?: FormValidationConfig<T> | T,
  validationRules?: Record<string, any[]>
) => {
  const isConfig = configOrInitialState && typeof configOrInitialState === "object" && ("initialValues" in configOrInitialState || "validationSchema" in configOrInitialState || "onSubmit" in configOrInitialState);

  const initialValues = isConfig
    ? (configOrInitialState as FormValidationConfig<T>).initialValues || ({} as T)
    : (configOrInitialState as T) || ({} as T);

  const schema = isConfig ? (configOrInitialState as FormValidationConfig<T>).validationSchema : null;
  const onSubmitCallback = isConfig ? (configOrInitialState as FormValidationConfig<T>).onSubmit : null;
  const rules = isConfig ? (configOrInitialState as FormValidationConfig<T>).rules || validationRules : validationRules;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: any) => {
    if (!rules || !rules[name]) return true;

    let isValid = true;
    let errorMessage = "";

    for (const rule of rules[name]) {
      if (rule.required && (value === undefined || value === null || value === "")) {
        errorMessage = rule.message || "This field is required";
        isValid = false;
        break;
      }
      if (rule.pattern && value && !rule.pattern.test(value)) {
        errorMessage = rule.message || "Invalid format";
        isValid = false;
        break;
      }
      if (rule.minLength && value && String(value).length < rule.minLength) {
        errorMessage = rule.message || `Minimum ${rule.minLength} characters required`;
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

    setErrors((prev) => ({
      ...prev,
      [name]: isValid ? "" : errorMessage,
    }));

    return isValid;
  }, [rules]);

  const handleChange = useCallback(
    (nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (typeof nameOrEvent === "string") {
        const name = nameOrEvent;
        return (eOrVal: any) => {
          const val = eOrVal && eOrVal.target ? eOrVal.target.value : eOrVal;
          setValues((prev) => ({ ...prev, [name]: val }));
          validateField(name, val);
        };
      } else {
        const { name, value } = nameOrEvent.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
      }
    },
    [validateField]
  );

  const handleBlur = useCallback(
    (nameOrEvent: string | React.FocusEvent<HTMLInputElement>) => {
      if (typeof nameOrEvent === "string") {
        const name = nameOrEvent;
        return () => {
          setTouched((prev) => ({ ...prev, [name]: true }));
          validateField(name, values[name]);
        };
      } else {
        const { name } = nameOrEvent.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateField(name, values[name]);
      }
    },
    [validateField, values]
  );

  const validateForm = useCallback((formData?: T) => {
    const dataToValidate = formData || values;
    let isValid = true;

    if (schema && typeof schema.validateSync === "function") {
      try {
        schema.validateSync(dataToValidate, { abortEarly: false });
        setErrors({});
      } catch (err: any) {
        isValid = false;
        const newErrors: Record<string, string> = {};
        if (err.inner) {
          err.inner.forEach((error: any) => {
            if (error.path) newErrors[error.path] = error.message;
          });
        }
        setErrors(newErrors);
      }
    } else if (rules) {
      for (const field in rules) {
        const val = dataToValidate[field];
        const fieldValid = validateField(field, val);
        if (!fieldValid) isValid = false;
      }
    }

    return isValid;
  }, [schema, rules, validateField, values]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e && typeof e.preventDefault === "function") {
        e.preventDefault();
      }
      const isValid = validateForm();
      if (isValid && onSubmitCallback) {
        await onSubmitCallback(values);
      }
    },
    [validateForm, onSubmitCallback, values]
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    setTouched,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    handleSubmit,
    isValid: Object.values(errors).every((err) => !err),
    handleChangeWithValidation: (e: any) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));
      validateField(name, value);
      return { name, value };
    },
  };
};

export default useFormValidation;
