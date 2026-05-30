import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@shared/components/Modal";
import Input from "@components/Input";
import { Button } from "@components/Button";
import { useToast } from "@hooks/useToast";
import { useCreateUserMutation, useUpdateUserMutation, type User } from "@features/users/api/usersApi";

const userSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["admin", "staff", "user"]),
});

type UserFormValues = z.infer<typeof userSchema>;

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  onSuccess: () => void;
};

export const UserFormModal = ({ isOpen, onClose, user, onSuccess }: UserFormModalProps) => {
  const toast = useToast();
  const isEditing = Boolean(user?.id);
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      role: "staff",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        email: user?.email ?? "",
        role: user?.role === "admin" || user?.role === "user" || user?.role === "staff" ? user.role : "staff",
      });
    }
  }, [isOpen, reset, user]);

  const handleClose = () => {
    reset({ email: "", role: "staff" });
    onClose();
  };

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (isEditing && user?.id) {
        await updateMutation.mutateAsync({ id: user.id, payload: values });
        toast.success("User updated successfully");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("User created successfully");
      }

      onSuccess();
      handleClose();
    } catch (error) {
      const apiError = error as {
        response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } };
      };
      const message = apiError.response?.data?.message || "Unable to save user";
      const emailError = apiError.response?.data?.errors?.email?.[0];

      if (apiError.response?.status === 403) {
        toast.error("You don't have permission");
        return;
      }

      if (emailError) {
        setError("email", { type: "manual", message: emailError });
      }

      toast.error(message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? "Edit User" : "Create User"}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="user@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Role
          <select
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register("role")}
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
          {errors.role ? <span className="text-sm text-red-500">{errors.role.message}</span> : null}
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}>
            {isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;