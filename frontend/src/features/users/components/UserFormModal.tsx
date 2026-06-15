import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@shared/components/Modal";
import Input from "@components/Input";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import {
  useGetUser,
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@features/users/api/usersApi";
import { userCreateSchema, userUpdateSchema } from "@shared/utils/validators";

const createFormSchema = userCreateSchema;
const updateFormSchema = userUpdateSchema.extend({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["USER", "ADMIN", "REVIEWER"]),
});

type CreateFormValues = z.infer<typeof createFormSchema>;
type UpdateFormValues = z.infer<typeof updateFormSchema>;

type UserFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
};

export const UserFormModal = ({ isOpen, onClose, userId }: UserFormModalProps) => {
  const isEditing = Boolean(userId);
  const toast = useToast();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const { data: existingUser } = useGetUser(userId ?? "", {
    enabled: isEditing && isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues | UpdateFormValues>({
    resolver: zodResolver(isEditing ? updateFormSchema : createFormSchema),
    defaultValues: {
      email: "",
      role: "USER",
      ...(isEditing ? {} : { password: "", fullName: "" }),
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && existingUser) {
        reset({
          email: existingUser.email,
          role: existingUser.role as "USER" | "ADMIN" | "REVIEWER",
        });
      } else if (!isEditing) {
        reset({
          email: "",
          password: "",
          role: "USER",
          fullName: "",
        });
      }
    }
  }, [isOpen, isEditing, existingUser, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CreateFormValues | UpdateFormValues) => {
    try {
      if (isEditing && userId) {
        await updateMutation.mutateAsync({
          id: userId,
          payload: values as UpdateFormValues,
        });
        toast.success("User updated successfully");
      } else {
        await createMutation.mutateAsync(values as CreateFormValues);
        toast.success("User created successfully");
      }
      handleClose();
    } catch (error) {
      const apiError = error as {
        response?: {
          status?: number;
          data?: { message?: string; errors?: Record<string, string[]> };
        };
      };

      if (apiError.response?.status === 403) {
        toast.error("You don't have permission");
        return;
      }

      const emailError = apiError.response?.data?.errors?.email?.[0];
      if (emailError) {
        setError("email", { type: "manual", message: emailError });
      }

      toast.error(
        apiError.response?.data?.message || "Unable to save user"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit User" : "Create User"}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Email"
          type="email"
          placeholder="user@example.com"
          disabled={isEditing}
          error={errors.email?.message}
          {...register("email")}
        />

        {!isEditing && (
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            error={"password" in errors ? (errors.password?.message ?? "") : ""}
            {...register("password")}
          />
        )}

        {!isEditing && (
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={"fullName" in errors ? (errors.fullName?.message ?? "") : ""}
            {...register("fullName")}
          />
        )}

        <label className="grid gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Role
          <select
            className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[var(--green-icon)] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            {...register("role")}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="REVIEWER">Reviewer</option>
          </select>
          {errors.role ? (
            <span className="text-sm text-red-500">{errors.role.message}</span>
          ) : null}
        </label>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={
              isSubmitting ||
              createMutation.isPending ||
              updateMutation.isPending
            }
          >
            {isEditing ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
