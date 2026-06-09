import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';
import DocumentUploadField from '../../components/document/DocumentUploadField';

const UploadDocumentPage: React.FC = () => {
  useProtectedRoute(['USER']);

  return (
    <div>
      <h1>Upload Document</h1>
      <DocumentUploadField kycId={''} type={'OTHER'} onSuccess={() => {}} />
    </div>
  );
};

export default UploadDocumentPage;
