import { useEffect } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@components/common/Button";
import InputField from "@components/common/Input";
import { useAppDispatch } from "@hooks/reduxHooks";
import { useToast } from "@shared/hooks/useToast";
import { registerSchema, type RegisterInput } from "@shared/validation/authSchemas";
import { registerRequest } from "@features/auth/api/authApi";
import { setTokens, setUser } from "@store/slices/authSlice";

const RegisterForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const handleInvalidSubmit = (formErrors: FieldErrors<RegisterInput>) => {
    const firstErrorMessage =
      formErrors.email?.message || formErrors.password?.message || formErrors.confirmPassword?.message;

    if (firstErrorMessage) {
      toast.error(firstErrorMessage);
    }
  };

  const onSubmit = async (values: RegisterInput) => {
    try {
      const response = await registerRequest(values);
      const accessToken = response?.accessToken ?? null;
      const refreshToken = response?.refreshToken ?? null;
      const nextUser = response?.user ?? null;

      if (!accessToken || !nextUser) {
        throw new Error("Registration failed");
      }

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }
      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("userData", JSON.stringify(nextUser));

      dispatch(setTokens({ accessToken, refreshToken: refreshToken ?? "" }));
      dispatch(setUser(nextUser));

      toast.success("Account created");
      navigate("/app/dashboard", { replace: true });
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message = apiError?.response?.data?.message || apiError?.message || "Registration failed";
      setError("email", { type: "manual", message });
      toast.error(message);
    }
  };

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-col gap-4 space-y-4"
      onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}
    >
      <InputField
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />

      <InputField
        label="Password"
        type="password"
        placeholder="********"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />

      <p className="-mt-2 text-xs text-gray-500 dark:text-gray-300">
        Password must be at least 8 characters and include uppercase, lowercase, and a number.
      </p>

      <InputField
        label="Confirm Password"
        type="password"
        placeholder="********"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create Account
        </Button>
      </div>
    </form>
  );
};

export default RegisterForm;