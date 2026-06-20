import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@hooks/reduxHooks";
import { selectIsAuthenticated, selectUser } from "@store/slices/authSlice";
import RegisterForm from "@features/auth/components/RegisterForm";

const RegisterPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate, user?.id]);

  return (
    <div className="min-h-screen bg-[var(--bg-color)] px-4 py-10 text-[var(--text-color)] transition-colors dark:bg-[#10211a]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] p-6 shadow-xl transition-colors dark:bg-[#18251f] sm:p-8">
          <div className="mb-6 space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--green-icon)]">CMS Access</p>
            <h1 className="text-3xl font-semibold text-[var(--text-color)]">Create Account</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Register to continue</p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;