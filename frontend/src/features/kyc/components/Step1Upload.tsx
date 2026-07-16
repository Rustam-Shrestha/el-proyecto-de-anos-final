import { useState, useCallback } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { useSubmitKYCMutation } from "@features/kyc/api/kycApi";

interface Props {
  onComplete: (files: { citizenshipFront: File | null; citizenshipBack: File | null; selfie: File | null }, kycId: string) => void;
}

export const Step1Upload = ({ onComplete }: Props) => {
  const toast = useToast();
  const submitMutation = useSubmitKYCMutation();

  const [citizenshipFront, setCitizenshipFront] = useState<File | null>(null);
  const [citizenshipBack, setCitizenshipBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!citizenshipFront || !citizenshipBack || !selfie) {
      toast("Please upload all required documents", "error");
      return;
    }
    if (!fullName || !phone) {
      toast("Please fill in your name and phone", "error");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    if (address) formData.append("address", address);
    if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
    if (email) formData.append("email", email);
    formData.append("idProof", citizenshipFront);
    formData.append("addressProof", citizenshipBack);
    formData.append("selfie", selfie);

    try {
      const result = await submitMutation.mutateAsync(formData);
      const kycId = result?.kyc_application_id || result?.id || "";
      onComplete(
        { citizenshipFront, citizenshipBack, selfie },
        kycId
      );
      toast("Documents uploaded successfully", "success");
    } catch {
      toast("Upload failed. Please try again.", "error");
    }
  }, [citizenshipFront, citizenshipBack, selfie, fullName, phone, address, dateOfBirth, email, submitMutation, onComplete, toast]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 1: Upload Documents</h2>
      <p className="text-sm text-gray-600 mb-4">
        Upload your citizenship front, back, and a selfie photo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name *</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border rounded p-2" placeholder="As on citizenship" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded p-2" placeholder="Phone number" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2" placeholder="Email address" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Address</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded p-2" placeholder="Current address" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded p-4">
          <label className="block text-sm font-medium mb-2">Citizenship Front *</label>
          <input type="file" accept="image/*" onChange={(e) => setCitizenshipFront(e.target.files?.[0] || null)} />
          {citizenshipFront && <p className="text-xs text-green-600 mt-1">{citizenshipFront.name}</p>}
        </div>
        <div className="border rounded p-4">
          <label className="block text-sm font-medium mb-2">Citizenship Back *</label>
          <input type="file" accept="image/*" onChange={(e) => setCitizenshipBack(e.target.files?.[0] || null)} />
          {citizenshipBack && <p className="text-xs text-green-600 mt-1">{citizenshipBack.name}</p>}
        </div>
        <div className="border rounded p-4">
          <label className="block text-sm font-medium mb-2">Selfie *</label>
          <input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} />
          {selfie && <p className="text-xs text-green-600 mt-1">{selfie.name}</p>}
        </div>
      </div>

      <Button variant="primary" onClick={handleSubmit} disabled={submitMutation.isPending}>
        {submitMutation.isPending ? "Uploading..." : "Upload & Continue"}
      </Button>
    </div>
  );
};
