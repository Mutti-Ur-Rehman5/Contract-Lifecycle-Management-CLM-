import { useQuery } from '@tanstack/react-query';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import '../../styles/components/signature-status.css';

const STATUS_COLORS = {
  pending: '#9AA1AC',
  signed: '#2E7D4F',
  declined: '#B3261E',
};

function SignatureStatusPanel({ contractId }) {
  const { data: signatures } = useQuery({
    queryKey: ['signatureStatus', contractId],
    queryFn: () => signatureApi.getStatus(contractId).then((r) => r.data.data),
    enabled: !!contractId,
  });

  if (!signatures || signatures.length === 0) return null;

  return (
    <div className="detail-card">
      <h3 className="detail-card-title">Signatures</h3>
      <div className="signature-status-list">
        {signatures.map((sig) => (
          <div key={sig._id} className="signature-status-item">
            <span
              className="signature-status-dot"
              style={{ backgroundColor: STATUS_COLORS[sig.status] || '#9AA1AC' }}
            />
            <div className="signature-status-info">
              <span className="signature-status-name">
                {sig.signerName}
                <span className="signature-status-role" style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', marginLeft: '4px' }}>
                  ({sig.signerRole === 'admin' ? 'Admin' : 'External'})
                </span>
              </span>
              <span className={`signature-status-badge ${sig.status}`}>
                {sig.status === 'signed'
                  ? 'Signed'
                  : sig.status === 'declined'
                  ? 'Declined'
                  : 'Pending'}
              </span>
              {sig.status === 'signed' && sig.signatureImageUrl && (
                <img
                  src={sig.signatureImageUrl}
                  alt="Signature"
                  style={{ height: '24px', maxWidth: '80px', objectFit: 'contain', marginTop: '2px' }}
                />
              )}
              {sig.signedAt && (
                <span className="signature-status-date">
                  {new Date(sig.signedAt).toLocaleDateString()} at {new Date(sig.signedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              {sig.signOrder > 0 && (
                <span className="signature-status-order">
                  #{sig.signOrder}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SignatureStatusPanel;
