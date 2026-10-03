import { useState, useCallback } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { useSubmitKYCMutation } from "@features/kyc/api/kycApi";
import InputField from "@components/common/InputField";
import { FileUploadField } from "@shared/components/FileUploadField";
import Card from "@shared/components/Card";

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
    if (!citizenshipFront || !citizenshipBack || !selfie) { toast("Please upload all required documents", "error"); return; }
    if (!fullName || !phone) { toast("Please fill in your name and phone", "error"); return; }
    const formData = new FormData();
    formData.append("fullName", fullName); formData.append("phone", phone);
    if (address) formData.append("address", address);
    if (dateOfBirth) formData.append("dateOfBirth", dateOfBirth);
    if (email) formData.append("email", email);
    formData.append("idProof", citizenshipFront); formData.append("addressProof", citizenshipBack); formData.append("selfie", selfie);
    try {
      const result = await submitMutation.mutateAsync(formData);
      const kycId = result?.kyc_application_id || result?.id || "";
      onComplete({ citizenshipFront, citizenshipBack, selfie }, kycId);
      toast("Documents uploaded successfully", "success");
    } catch { toast("Upload failed. Please try again.", "error"); }
  }, [citizenshipFront, citizenshipBack, selfie, fullName, phone, address, dateOfBirth, email, submitMutation, onComplete, toast]);

  return (
    <Card className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#0F172A]">Step 1: Upload Documents</h2>
        <p className="text-sm text-[#64748B] mt-1">Upload your citizenship front, back, and a selfie photo.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As on citizenship" />
        <InputField label="Phone *" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
        <InputField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
        <InputField label="Date of Birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        <div className="md:col-span-2"><InputField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Current address" /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FileUploadField label="Citizenship Front *" accept="image/*" onFileSelect={setCitizenshipFront} />
        <FileUploadField label="Citizenship Back *" accept="image/*" onFileSelect={setCitizenshipBack} />
        <FileUploadField label="Selfie *" accept="image/*" onFileSelect={setSelfie} />
      </div>
      <Button variant="primary" onClick={handleSubmit} isLoading={submitMutation.isPending}>Upload & Continue</Button>
    </Card>
  );
};
