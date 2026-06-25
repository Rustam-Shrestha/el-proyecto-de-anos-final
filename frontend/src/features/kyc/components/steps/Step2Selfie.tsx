import { memo } from "react";
import { DocumentType } from "@shared/types/common";
import { FileUploadField } from "@shared/components/FileUploadField";
import { FILE_VALIDATION } from "@shared/types/common";

interface UploadedDoc {
  documentId: string;
  kycApplicationId: string;
}

interface Step2SelfieProps {
  selfie: File | null;
  uploaded: UploadedDoc | null;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export const Step2Selfie = memo(
  ({ selfie, uploaded, isUploading, onFileSelect, onClear }: Step2SelfieProps) => {
    const accept = FILE_VALIDATION.ALLOWED_MIME_TYPES.join(",");

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
            Selfie Photo
          </h3>
          <p
            className="mt-1 rounded-lg border bg-amber-50 px-4 py-3 text-sm text-amber-800   "
            style={{ borderColor: "var(--border-color)" }}
          >
            Hold your citizenship ID next to your face so both are clearly visible in the photo
          </p>
        </div>

        <FileUploadField
          label="Selfie with ID"
          documentType={DocumentType.SELFIE}
          accept={accept}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={selfie}
          uploadedUrl={uploaded ? "uploaded" : null}
          isUploading={isUploading}
          onFileSelect={onFileSelect}
          onClear={onClear}
          isRequired
        />
      </div>
    );
  }
);

Step2Selfie.displayName = "Step2Selfie";

export default Step2Selfie;
