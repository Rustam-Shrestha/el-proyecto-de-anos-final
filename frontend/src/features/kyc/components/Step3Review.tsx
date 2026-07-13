import { useState, useEffect } from "react";
import { Button } from "@shared/components/Button";
import { useToast } from "@shared/hooks/useToast";
import { apiClient } from "@shared/lib/apiClient";

interface Props {
  kycApplicationId: string;
  ocrData: Record<string, string>;
  onComplete: (confirmedData: any) => void;
  onBack: () => void;
}

const FIELDS = [
  { key: "confirmedCitizenshipNumber", label: "Citizenship Number", ocrKey: "citizenship_number" },
  { key: "confirmedFullName", label: "Full Name", ocrKey: "name" },
  { key: "confirmedDateOfBirth", label: "Date of Birth", ocrKey: "dob" },
  { key: "confirmedGender", label: "Gender", ocrKey: "gender" },
  { key: "confirmedAddress", label: "Address", ocrKey: "address" },
];

export const Step3Review = ({ kycApplicationId, ocrData, onComplete, onBack }: Props) => {
  const toast = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const initial: Record<string, string> = {};
    FIELDS.forEach(({ key, ocrKey }) => {
      initial[key] = ocrData?.[ocrKey] || "";
    });
    setForm(initial);
  }, [ocrData]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.confirmedCitizenshipNumber || !form.confirmedFullName) {
      toast("Citizenship number and full name are required", "error");
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/kyc/submit-confirmed", {
        kycApplicationId,
        confirmedData: form,
      });
      toast("Data saved successfully", "success");
      onComplete(form);
    } catch {
      toast("Failed to save data. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Step 3: Review & Confirm Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please review the extracted data and correct any errors. Your confirmed data is the source of truth.
      </p>

      <div className="space-y-4 mb-6">
        {FIELDS.map(({ key, label, ocrKey }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <div className="flex gap-2 items-start">
              <input
                type="text"
                value={form[key] || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`w-full border rounded p-2 ${ocrData?.[ocrKey] && ocrData[ocrKey] !== form[key] ? "border-amber-400 bg-amber-50" : ""}`}
                placeholder={`OCR: ${ocrData?.[ocrKey] || "not detected"}`}
              />
              {ocrData?.[ocrKey] && ocrData[ocrKey] !== form[key] && (
                <button
                  type="button"
                  className="text-blue-500 text-xs underline mt-2 shrink-0"
                  onClick={() => handleChange(key, ocrData[ocrKey])}
                >
                  Reset
                </button>
              )}
            </div>
            {ocrData?.[ocrKey] && (
              <p className="text-xs text-gray-400 mt-1">OCR detected: {ocrData[ocrKey]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : "Confirm & Continue"}
        </Button>
      </div>
    </div>
  );
};
