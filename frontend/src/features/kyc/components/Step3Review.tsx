import { useState, useEffect } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";
import CustomSelectField from "@components/common/SelectField";

interface Props {
  kycApplicationId: string;
  ocrData: Record<string, string>;
  onComplete: (confirmedData: Record<string, string>) => void;
  onBack: () => void;
}

const FIELDS = [
  { key: "confirmedCitizenshipNumber", label: "Citizenship Number", ocrKey: "citizenship_number" },
  { key: "confirmedFullName", label: "Full Name", ocrKey: "name" },
  { key: "confirmedDateOfBirth", label: "Date of Birth", ocrKey: "dob" },
  { key: "confirmedGender", label: "Gender", ocrKey: "gender" },
  { key: "confirmedAddress", label: "Address", ocrKey: "address" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const normalizeGender = (value?: string): string => {
  if (!value) return "";
  const v = value.trim().toUpperCase();
  if (v === "M" || v === "MALE") return "MALE";
  if (v === "F" || v === "FEMALE") return "FEMALE";
  if (v === "O" || v === "OTHER" || v === "TG") return "OTHER";
  return v;
};

export const Step3Review = ({ kycApplicationId, ocrData, onComplete, onBack }: Props) => {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    FIELDS.forEach(({ key, ocrKey }) => {
      const raw = ocrData?.[ocrKey] || "";
      initial[key] = key === "confirmedGender" ? normalizeGender(raw) : raw;
    });
    setForm(initial);
  }, [ocrData]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: key === "confirmedGender" ? normalizeGender(value) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.confirmedCitizenshipNumber || !form.confirmedFullName) {
      toast.error("Citizenship number and full name are required");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/kyc/submit-confirmed", {
        kycApplicationId,
        confirmedData: form,
      });
      toast.success("Data saved successfully");
      onComplete(form);
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } } };
      toast.error(apiError.response?.data?.message || "Failed to save data. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 3: Review & Confirm Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please review your submitted details and correct any errors before continuing. Your entered values are the source of truth.
      </p>

      <div className="space-y-4 mb-6">
        {FIELDS.map(({ key, label, ocrKey }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
            <div className="flex gap-2 items-start">
              {key === "confirmedGender" ? (
                <div className="w-full">
                  <CustomSelectField
                    value={form[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    options={GENDER_OPTIONS}
                    placeholder="Select Gender"
                  />
                </div>
              ) : (
                <div className="flex-1 flex gap-2 items-start">
                  <input
                    type={key === "confirmedDateOfBirth" ? "date" : "text"}
                    value={form[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 ${
                      ocrData?.[ocrKey] && ocrData[ocrKey] !== form[key]
                        ? "border-amber-400 bg-amber-50/40"
                        : "border-gray-200"
                    }`}
                    placeholder={`OCR: ${ocrData?.[ocrKey] || "not detected"}`}
                  />
                  {ocrData?.[ocrKey] && ocrData[ocrKey] !== form[key] && (
                    <button
                      type="button"
                      className="text-xs text-blue-600 underline mt-2.5 shrink-0 hover:text-blue-800"
                      onClick={() => handleChange(key, ocrData[ocrKey])}
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>
            {ocrData?.[ocrKey] && (
              <p className="text-xs text-gray-400 mt-1">Submitted OCR value: {ocrData[ocrKey]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Confirm & Continue"}
        </Button>
      </div>
    </div>
  );
};
