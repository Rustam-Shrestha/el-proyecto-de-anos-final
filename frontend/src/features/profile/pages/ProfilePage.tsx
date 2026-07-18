import { memo } from "react";
import ProfileForm from "@features/profile/components/ProfileForm";

const ProfilePage = memo(() => {
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

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm  ">
        <ProfileForm />
      </div>
    </div>
  );
});

ProfilePage.displayName = "ProfilePage";

export default ProfilePage;
