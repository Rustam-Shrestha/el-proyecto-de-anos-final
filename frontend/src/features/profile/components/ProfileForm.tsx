import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "@components/common/InputField";
import { Button } from "@components/common/Button";
import { useToast } from "@shared/hooks/useToast";
import { useAuth } from "@hooks/useAuth";
import {
  resolveAvatarUrl,
  useDeleteAvatarMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  type ProfileUser,
} from "@features/profile/api/profileApi";
import { Trash2, Upload, UserCircle2 } from "lucide-react";

const phoneRegex = /^\+?[0-9()\s-]{7,20}$/;

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || phoneRegex.test(value), {
      message: "Enter a valid phone number",
    }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const buildDefaultValues = (userData: ProfileUser | null | undefined): ProfileFormValues => ({
  fullName: userData?.fullName || userData?.name || "",
  phone: userData?.phone || "",
});

export const ProfileForm = () => {
  const toast = useToast();
  const { userData, accessToken, refreshToken, setUserData: persistUserData } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();
  const deleteAvatarMutation = useDeleteAvatarMutation();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState<string | null>(null);

  const defaultValues = useMemo(() => buildDefaultValues(userData as ProfileUser | null), [userData]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    return () => {
      if (selectedAvatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedAvatarPreview);
      }
    };
  }, [selectedAvatarPreview]);

  const syncStoredAuth = (nextUser: ProfileUser) => {
    const token = accessToken || localStorage.getItem("accessToken");
    const nextRefreshToken = refreshToken || localStorage.getItem("refreshToken");

    if (token) {
      const authPayload = {
        accessToken: token,
        refreshToken: nextRefreshToken,
        user: nextUser,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      localStorage.setItem("userData", JSON.stringify(nextUser));
      localStorage.setItem("userAuth", JSON.stringify(authPayload));
    }
  };

  const applyProfileUpdate = (nextUser: ProfileUser) => {
    persistUserData(nextUser);
    syncStoredAuth(nextUser);
  };

  const currentAvatarSrc = selectedAvatarPreview || resolveAvatarUrl(userData?.avatarUrl) || null;

  const handleAvatarPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (selectedAvatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedAvatarPreview);
    }

    setSelectedAvatarFile(file);
    setSelectedAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const clearAvatarSelection = () => {
    setSelectedAvatarFile(null);

    if (selectedAvatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedAvatarPreview);
    }

    setSelectedAvatarPreview(null);

    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) {
      toast.error("Choose an image first");
      return;
    }

    try {
      const updated = await uploadAvatarMutation.mutateAsync(selectedAvatarFile);
      applyProfileUpdate({ ...(userData as ProfileUser), ...(updated || {}) });
      clearAvatarSelection();
      toast.success("Avatar updated successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload avatar";
      toast.error(message);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      const updated = await deleteAvatarMutation.mutateAsync();
      applyProfileUpdate({ ...(userData as ProfileUser), ...(updated || {}), avatarUrl: null });
      clearAvatarSelection();
      toast.success("Avatar removed");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to remove avatar";
      toast.error(message);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const updated = await updateProfileMutation.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
      });

      const nextUser: ProfileUser = {
        ...(userData as ProfileUser),
        ...(updated || {}),
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
      };

      persistUserData(nextUser);
      syncStoredAuth(nextUser);
      reset({
        fullName: nextUser.fullName || "",
        phone: nextUser.phone || "",
      });
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      const apiError = error as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
        message?: string;
      };
      const message = apiError?.response?.data?.message || apiError?.message || "Failed to update profile";
      const fieldErrors = apiError?.response?.data?.errors;

      if (fieldErrors?.fullName?.[0]) {
        setError("fullName", { type: "server", message: fieldErrors.fullName[0] });
      }

      if (fieldErrors?.phone?.[0]) {
        setError("phone", { type: "server", message: fieldErrors.phone[0] });
      }

      if (!fieldErrors) {
        setError("fullName", { type: "server", message });
      }

      toast.error(message);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
              {currentAvatarSrc ? (
                <img src={currentAvatarSrc} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 className="h-10 w-10" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile photo</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">JPEG, PNG, WebP or GIF up to 5 MB.</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
            <Button
              type="button"
              variant="ghost"
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadAvatarMutation.isPending || deleteAvatarMutation.isPending}
            >
              Choose image
            </Button>
            <Button
              type="button"
              isLoading={uploadAvatarMutation.isPending}
              onClick={handleAvatarUpload}
              disabled={!selectedAvatarFile || deleteAvatarMutation.isPending}
            >
              Upload avatar
            </Button>
            <Button
              type="button"
              variant="danger"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={handleAvatarDelete}
              disabled={!userData?.avatarUrl || uploadAvatarMutation.isPending}
            >
              Remove
            </Button>
          </div>
        </div>
        {selectedAvatarFile ? (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Selected: {selectedAvatarFile.name}
          </p>
        ) : null}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="Email"
          type="email"
          value={userData?.email || ""}
          readOnly
          className="md:col-span-2"
        />

        <InputField
          label="Full name"
          placeholder="Your full name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <InputField
          label="Phone"
          placeholder="+1 555 123 4567"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
        Avatar changes are saved separately from profile text updates.
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="sm:min-w-28"
          onClick={() => reset(defaultValues)}
          disabled={updateProfileMutation.isPending || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="sm:min-w-28"
          isLoading={updateProfileMutation.isPending || isSubmitting}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;