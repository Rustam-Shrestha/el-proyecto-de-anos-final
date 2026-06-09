import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useDocument from '../../hooks/useDocument';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams();
  const { getById, data, loading } = useDocument();

  useEffect(() => { if (id) getById(id); }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div>Document not found</div>;

  return (
    <div>
      <h1>Document Detail</h1>
      <div>Type: {data.type}</div>
      <div>Size: {data.sizeBytes}</div>
      <div>Uploaded: {new Date(data.createdAt).toLocaleString()}</div>
      <a href={data.filePath} target="_blank" rel="noreferrer">Download</a>
    </div>
  );
};

export default DocumentDetailPage;
