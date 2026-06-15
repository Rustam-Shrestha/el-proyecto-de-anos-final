import { memo } from "react";
import { DocumentType } from "@shared/types/common";
import { FileUploadField } from "@shared/components/FileUploadField";
import { FILE_VALIDATION } from "@shared/types/common";

interface UploadedDoc {
  documentId: string;
  kycApplicationId: string;
}

interface Step1IdentityProps {
  citizenshipFront: File | null;
  citizenshipBack: File | null;
  frontUploaded: UploadedDoc | null;
  backUploaded: UploadedDoc | null;
  isUploadingFront: boolean;
  isUploadingBack: boolean;
  onFileSelect: (type: DocumentType, file: File) => void;
  onClear: (type: DocumentType) => void;
}

export const Step1Identity = memo(
  ({
    citizenshipFront,
    citizenshipBack,
    frontUploaded,
    backUploaded,
    isUploadingFront,
    isUploadingBack,
    onFileSelect,
    onClear,
  }: Step1IdentityProps) => {
    const accept = FILE_VALIDATION.ALLOWED_MIME_TYPES.join(",");

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
            Identity Documents
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-column-text, #6b7280)" }}>
            Upload the front and back of your government-issued citizenship ID
          </p>
        </div>

        <FileUploadField
          label="Citizenship ID — Front"
          documentType={DocumentType.CITIZENSHIP_FRONT}
          accept={accept}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={citizenshipFront}
          uploadedUrl={frontUploaded ? "uploaded" : null}
          isUploading={isUploadingFront}
          onFileSelect={(file) => onFileSelect(DocumentType.CITIZENSHIP_FRONT, file)}
          onClear={() => onClear(DocumentType.CITIZENSHIP_FRONT)}
          isRequired
        />

        <FileUploadField
          label="Citizenship ID — Back"
          documentType={DocumentType.CITIZENSHIP_BACK}
          accept={accept}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={citizenshipBack}
          uploadedUrl={backUploaded ? "uploaded" : null}
          isUploading={isUploadingBack}
          onFileSelect={(file) => onFileSelect(DocumentType.CITIZENSHIP_BACK, file)}
          onClear={() => onClear(DocumentType.CITIZENSHIP_BACK)}
          isRequired
        />
      </div>
    );
  }
);

Step1Identity.displayName = "Step1Identity";

export default Step1Identity;
