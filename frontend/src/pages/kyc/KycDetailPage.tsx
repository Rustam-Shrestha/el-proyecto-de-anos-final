import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useProtectedRoute from '../../middleware/protectedRoute';
import useKyc from '../../hooks/useKyc';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ApproveKycModal from '../../components/modals/ApproveKycModal';
import RejectKycModal from '../../components/modals/RejectKycModal';

const KycDetailPage: React.FC = () => {
  useProtectedRoute(['ADMIN', 'REVIEWER']);
  const { id } = useParams();
  const { fetchById, approve, reject, data, loading } = useKyc(id);
  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  useEffect(() => { if (id) fetchById(id); }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <div>KYC not found</div>;

  return (
    <div>
      <h1>KYC Detail</h1>
      <div>Status: {data.status}</div>
      <div>Documents: {data.documents.length}</div>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setOpenApprove(true)}>Approve</button>
        <button onClick={() => setOpenReject(true)}>Reject</button>
      </div>

      <ApproveKycModal open={openApprove} onClose={() => setOpenApprove(false)} onConfirm={async () => { await approve(data.id); setOpenApprove(false); }} />
      <RejectKycModal open={openReject} onClose={() => setOpenReject(false)} onConfirm={async (reason) => { await reject(data.id, { rejectionReason: reason }); setOpenReject(false); }} />
    </div>
  );
};

export default KycDetailPage;
