import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@components/common/Button";
import InputField from "@components/common/Input";
import PopMessage from "@components/PopMessage";
import { useAppDispatch, useAppSelector } from "@hooks/reduxHooks";
import { loginRequest } from "@features/auth/api/authApi";
import { loginSchema, type LoginInput } from "@shared/validation/authSchemas";
import {
  selectIsAuthenticated,
  selectUser,
  setError,
  setLoading,
  setTokens,
  setUser,
} from "@store/slices/authSlice";

const Auth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    document.documentElement.classList.toggle("dark", savedDarkMode);
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      document.documentElement.style.setProperty("--theme-primary", savedTheme);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, user?.id]);

  const handleLogin = async (values: LoginInput) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const payload = await loginRequest(values);
      const accessToken = payload?.accessToken ?? null;
      const refreshToken = payload?.refreshToken ?? null;
      const nextUser = payload?.user ?? null;

      if (!accessToken || !nextUser) {
        throw new Error("Login failed. Please verify your credentials.");
      }

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      } else {
        localStorage.removeItem("refreshToken");
      }
      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("userData", JSON.stringify(nextUser));
      localStorage.setItem(
        "userAuth",
        JSON.stringify({ accessToken, refreshToken, user: nextUser })
      );

      dispatch(setTokens({ accessToken, refreshToken: refreshToken ?? "" }));
      dispatch(setUser(nextUser));

      PopMessage.success("Login successful");
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        apiError?.response?.data?.message || apiError?.message || "Login failed";
      dispatch(setError(message));
      setFieldError("email", { type: "manual", message });
      PopMessage.error(message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-color)] px-4 py-10 text-[var(--text-color)] transition-colors dark:bg-[#10211a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 shadow-xl transition-colors dark:bg-[#18251f] sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--green-icon)]">
              CMS Access
            </p>
            <h1 className="text-3xl font-semibold text-[var(--text-color)]">Login to FinGuard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Enter your credentials</p>
          </div>

          <form
            className="mx-auto flex w-full max-w-md flex-col gap-4 space-y-4"
            onSubmit={handleSubmit(handleLogin)}
          >
            <InputField
              label="Email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <InputField
              label="Password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSubmitting} className="min-w-32">
                Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
