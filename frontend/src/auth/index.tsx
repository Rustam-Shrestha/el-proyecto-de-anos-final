// @ts-nocheck
/**
 * Auth (Login) Page
 *
 * Handles user authentication with email/password.
 * Uses Redux (useAuth) for user state instead of the old ModalContext.
 * Uses useApiMutation (TanStack Query) instead of the withApiCall HOC.
 */
import { memo, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton } from "@components/common/Button";
import Modal from "@components/common/Modal";
import useAuth from "@hooks/useAuth";
import { useApiMutation } from "@hooks/useApiQuery";
import { apiService } from "@services/apiService";
import { endpoints } from "@services/endpoints";

const Auth = memo(() => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const { setUserData, userData } = useAuth();

  const { mutate: loginMutate, isPending } = useApiMutation(
    endpoints.login,
    "post"
  );

  // Redirect if already authenticated
  useEffect(() => {
    (async () => {
      if (userData?.id) {
        try {
          const response = await apiService.get(endpoints.myProfile);
          if (response?.data?.id) {
            navigate("/app/dashboard");
          }
        } catch (_err) {
          // Profile fetch failed — stay on login
        }
      }
    })();
  }, [userData, navigate]);

  const handleLogin = useCallback(
    (event) => {
      event.preventDefault();
      setErrorMessage(null);

      loginMutate(
        { payload: form },
        {
          onSuccess: (response) => {
            const accessToken = response?.accessToken;
            const refreshToken = response?.refreshToken;
            const user = response?.user;

            localStorage.setItem("accessToken", accessToken || "");
            localStorage.setItem(
              "userAuth",
              JSON.stringify({
                accessToken,
                refreshToken,
                user
              })
            );
            localStorage.setItem("userData", JSON.stringify(user));

            setUserData(user);

            if (accessToken) {
              navigate("/app/dashboard");
            } else {
              setErrorMessage("Invalid credentials. Please try again.");
            }
          },
          onError: (err) => {
            setErrorMessage(
              err?.message || "An error occurred during login."
            );
          },
        }
      );
    },
    [loginMutate, setUserData, navigate, form]
  );

  return (
    <div className="auth-shell p-4">
      <Modal size="md" title="CMS Login" onClose={() => { }}>
        <div className="p-6">
          <form className="flex flex-col gap-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm mb-1 text-primary">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-slate-800"
                placeholder="admin@example.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-primary">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-slate-800"
                placeholder="********"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>

            {errorMessage ? <p className="text-red text-sm">{errorMessage}</p> : null}

            <div className="flex justify-end">
              <PrimaryButton type="submit" label="Login" loading={isPending} />
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
});

Auth.displayName = "Auth";

export default Auth;
