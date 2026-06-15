import { memo } from "react";
import { DocumentType } from "@shared/types/common";
import { FileUploadField } from "@shared/components/FileUploadField";
import { FILE_VALIDATION } from "@shared/types/common";

interface UploadedDoc {
  documentId: string;
  kycApplicationId: string;
}

type UploadedMap = Record<string, UploadedDoc | null>;

interface Step4IncomeProps {
  incomeProofs: File[];
  bankStatement: File | null;
  existingLoan: File | null;
  collateral: File | null;
  uploaded: UploadedMap;
  uploading: Record<string, boolean>;
  onFileSelect: (type: DocumentType, file: File) => void;
  onClear: (type: DocumentType) => void;
}

export const Step4Income = memo(
  ({
    incomeProofs,
    bankStatement,
    existingLoan,
    collateral,
    uploaded,
    uploading,
    onFileSelect,
    onClear,
  }: Step4IncomeProps) => {
    const accept = [FILE_VALIDATION.ALLOWED_MIME_TYPES.join(",")];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
            Income & Financial Documents
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--gray-column-text, #6b7280)" }}>
            Upload proof of income and optional financial documents
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--surface-color)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
              Income Proof {incomeProofs.length > 0 ? `(${incomeProofs.length} uploaded)` : ""}
            </span>
            <span className="text-xs" style={{ color: "var(--gray-column-text, #6b7280)" }}>
              Min 1 &middot; Max 5
            </span>
          </div>

          <div className="space-y-3">
            {Array.from({ length: Math.max(1, incomeProofs.length + 1) }).map((_, i) => {
              if (i < incomeProofs.length) {
                const key = `${DocumentType.INCOME_PROOF}_${i}`;
                return (
                  <FileUploadField
                    key={key}
                    label={`Income Document ${i + 1}`}
                    documentType={DocumentType.INCOME_PROOF}
                    accept={accept.join()}
                    maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
                    currentFile={incomeProofs[i]}
                    uploadedUrl={uploaded[key] ? "uploaded" : null}
                    isUploading={Boolean(uploading[key])}
                    onFileSelect={(file) => onFileSelect(DocumentType.INCOME_PROOF, file)}
                    onClear={() => onClear(`${DocumentType.INCOME_PROOF}_${i}` as DocumentType)}
                  />
                );
              }
              if (incomeProofs.length < 5) {
                return (
                  <FileUploadField
                    key={`income_empty_${i}`}
                    label={`Income Document ${i + 1}`}
                    documentType={DocumentType.INCOME_PROOF}
                    accept={accept.join()}
                    maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
                    currentFile={null}
                    onFileSelect={(file) => onFileSelect(DocumentType.INCOME_PROOF, file)}
                    onClear={() => {}}
                    isRequired={i === 0 && incomeProofs.length === 0}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>

        <FileUploadField
          label="Bank Statement (optional)"
          documentType={DocumentType.BANK_STATEMENT}
          accept={accept.join()}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={bankStatement}
          uploadedUrl={uploaded[DocumentType.BANK_STATEMENT] ? "uploaded" : null}
          isUploading={Boolean(uploading[DocumentType.BANK_STATEMENT])}
          onFileSelect={(file) => onFileSelect(DocumentType.BANK_STATEMENT, file)}
          onClear={() => onClear(DocumentType.BANK_STATEMENT)}
        />

        <FileUploadField
          label="Existing Loan Document (optional)"
          documentType={DocumentType.EXISTING_LOAN}
          accept={accept.join()}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={existingLoan}
          uploadedUrl={uploaded[DocumentType.EXISTING_LOAN] ? "uploaded" : null}
          isUploading={Boolean(uploading[DocumentType.EXISTING_LOAN])}
          onFileSelect={(file) => onFileSelect(DocumentType.EXISTING_LOAN, file)}
          onClear={() => onClear(DocumentType.EXISTING_LOAN)}
        />

        <FileUploadField
          label="Collateral Document (optional)"
          documentType={DocumentType.COLLATERAL}
          accept={accept.join()}
          maxSizeMB={FILE_VALIDATION.MAX_SIZE_MB}
          currentFile={collateral}
          uploadedUrl={uploaded[DocumentType.COLLATERAL] ? "uploaded" : null}
          isUploading={Boolean(uploading[DocumentType.COLLATERAL])}
          onFileSelect={(file) => onFileSelect(DocumentType.COLLATERAL, file)}
          onClear={() => onClear(DocumentType.COLLATERAL)}
        />
      </div>
    );
  }
);

Step4Income.displayName = "Step4Income";

export default Step4Income;
