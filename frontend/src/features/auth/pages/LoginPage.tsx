import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@shared/validation/authSchemas";
import { loginRequest } from "@features/auth/api/authApi";
import { useAppDispatch } from "@hooks/reduxHooks";
import { loginSuccess } from "@features/auth/store/authSlice";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      localStorage.setItem("accessToken", data.token);
      dispatch(
        loginSuccess({
          accessToken: data.token,
          user: data.user
        })
      );
      navigate("/dashboard");
    }
  });

  return (
    <section className="auth-shell">
      <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))} className="auth-form">
        <h2>Sign in</h2>
        <label>
          Email
          <input data-testid="login-email" {...register("email")} type="email" />
        </label>
        <label>
          Password
          <input data-testid="login-password" {...register("password")} type="password" />
        </label>
        {formState.errors.email && <p>{formState.errors.email.message}</p>}
        {formState.errors.password && <p>{formState.errors.password.message}</p>}
        <button data-testid="login-submit" disabled={loginMutation.isPending} type="submit">
          {loginMutation.isPending ? "Signing in..." : "Login"}
        </button>
      </form>
    </section>
  );
};

export default LoginPage;
