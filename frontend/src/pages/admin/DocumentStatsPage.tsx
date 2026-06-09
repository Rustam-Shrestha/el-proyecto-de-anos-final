import React from 'react';
import useProtectedRoute from '../../middleware/protectedRoute';

const DocumentStatsPage: React.FC = () => {
  useProtectedRoute(['ADMIN']);
  return (
    <div>
      <h1>Document Stats</h1>
      <p>Document stats widget would be here.</p>
    </div>
  );
};

export default DocumentStatsPage;
