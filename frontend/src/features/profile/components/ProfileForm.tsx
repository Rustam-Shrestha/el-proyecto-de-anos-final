import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@components/Input";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { useAuth } from "@store/hooks";
import { useUpdateProfileMutation } from "@features/profile/api/profileApi";
import { profileUpdateSchema } from "@shared/utils/validators";

const updateProfileSchema = profileUpdateSchema.extend({
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof updateProfileSchema>;

export const ProfileForm = () => {
  const toast = useToast();
  const { userData, setUser } = useAuth();
  const updateProfileMutation = useUpdateProfileMutation();

  const defaultValues: ProfileFormValues = {
    fullName: (userData?.fullName as string) || userData?.name || "",
    phone: (userData?.phone as string) || "",
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues,
  });

  useEffect(() => {
    reset({
      fullName: (userData?.fullName as string) || userData?.name || "",
      phone: (userData?.phone as string) || "",
    });
  }, [userData, reset]);

  const handleCancel = () => {
    reset(defaultValues);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const updated = await updateProfileMutation.mutateAsync({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
      });

      const nextUser = {
        ...userData,
        ...updated,
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
      };

      setUser(nextUser);
      reset({
        fullName: nextUser.fullName as string,
        phone: (nextUser.phone as string) || "",
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: { message?: string; errors?: Record<string, string[]> };
        };
        message?: string;
      };
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        "Failed to update profile";
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
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={(userData?.email as string) || ""}
          className="md:col-span-2"
          disabled
        />

        <Input
          label="First Name"
          placeholder="Your first name"
          error={errors.fullName?.message}
          {...register("fullName")}
        />

        <Input
          label="Phone Number"
          placeholder="+1 555 123 4567"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={updateProfileMutation.isPending || isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={updateProfileMutation.isPending || isSubmitting}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;
