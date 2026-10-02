import { memo, useRef } from "react";
import ProfileForm from "@features/profile/components/ProfileForm";
import { useAuth } from "@store/hooks";
import { useToast } from "@shared/hooks/useToast";
import {
  resolveAvatarUrl,
  useDeleteAvatarMutation,
  useUploadAvatarMutation,
} from "@features/profile/api/profileApi";

const ProfilePage = memo(() => {
  const toast = useToast();
  const { userData, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatarMutation();
  const deleteAvatar = useDeleteAvatarMutation();

  const avatarSrc =
    typeof userData?.avatarUrl === "string"
      ? resolveAvatarUrl(userData.avatarUrl) || undefined
      : undefined;
  const displayName = String(
    (userData?.fullName as string) ||
      (userData as unknown as { name?: string })?.name ||
      (userData as unknown as { email?: string })?.email ||
      "U"
  );
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const updated = await uploadAvatar.mutateAsync(file);
      setUser({ ...userData, ...updated });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    }
  };

  const handleAvatarRemove = async () => {
    try {
      const updated = await deleteAvatar.mutateAsync();
      setUser({ ...userData, ...updated, avatarUrl: null });
      toast.success("Avatar removed");
    } catch {
      toast.error("Failed to remove avatar");
    }
  };

  const busy = uploadAvatar.isPending || deleteAvatar.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--green-icon)]">
          User Profile
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-gray-900 ">
          My Profile
        </h2>
        <p className="mt-2 text-sm text-gray-500 ">
          Update your account details and contact information.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-lg font-semibold text-gray-600">
            {avatarSrc ? (
              <img src={avatarSrc} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploadAvatar.isPending ? "Uploading…" : "Change avatar"}
            </button>
            {avatarSrc ? (
              <button
                type="button"
                onClick={handleAvatarRemove}
                disabled={busy}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleteAvatar.isPending ? "Removing…" : "Remove"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
        <ProfileForm />
      </div>
    </div>
  );
});

ProfilePage.displayName = "ProfilePage";

export default ProfilePage;
