import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../../features/workflows/workflowApi.js';
import { contractApi } from '../../features/contracts/contractApi.js';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import SignaturePad from '../../components/signature/SignaturePad.jsx';
import '../../styles/pages/approval-inbox.css';

const STAGE_COLORS = {
  draft: '#9AA1AC',
  internal_review: '#7C8BC4',
  legal_review: '#8A5FBF',
  finance_approval: '#C68A2E',
  executive_approval: '#B5543A',
  pending_signature: '#1F5C4C',
  published: '#2E7D4F',
  archived: '#5B6472',
  rejected: '#B3261E',
};

function ApprovalInboxPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [drawerItem, setDrawerItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [comment, setComment] = useState('');
  const [actedId, setActedId] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const { data: inbox, isLoading, error } = useQuery({
    queryKey: ['approvalInbox'],
    queryFn: () => workflowApi.getInbox().then((r) => r.data.data),
    refetchInterval: 15000,
  });

  const actMutation = useMutation({
    mutationFn: ({ type, instanceId, comment: c }) => {
      if (type === 'approve') return workflowApi.approve(instanceId, c);
      if (type === 'reject') return workflowApi.reject(instanceId, c);
      return workflowApi.requestChanges(instanceId, c);
    },
    onSuccess: () => {
      const actedItemId = drawerItem?._id;
      setActedId(actedItemId);
      setDrawerItem(null);
      setActionType(null);
      setComment('');
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['approvalInbox'] });
        setActedId(null);
      }, 600);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Action failed';
      alert(msg);
      console.error('Approval action failed:', err);
    },
  });

  const signMutation = useMutation({
    mutationFn: ({ contractId, signatureImageUrl }) =>
      signatureApi.sign(contractId, signatureImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalInbox'] });
      if (drawerItem?.contract?._id) {
        queryClient.invalidateQueries({ queryKey: ['signatureStatus', drawerItem.contract._id] });
        queryClient.invalidateQueries({ queryKey: ['contract', drawerItem.contract._id] });
      }
      setShowSignaturePad(false);
    },
    onError: (err) => {
      const msg = err?.response?.data?.error?.message || err?.message || 'Signing failed';
      alert(msg);
    },
  });

  const openDrawer = (item) => {
    setDrawerItem(item);
    setActionType(null);
    setComment('');
    setShowSignaturePad(false);
  };

  const closeDrawer = () => {
    setDrawerItem(null);
    setActionType(null);
    setComment('');
    setShowSignaturePad(false);
  };

  const handleConfirm = () => {
    if (!drawerItem || !actionType) return;
    actMutation.mutate({
      type: actionType,
      instanceId: drawerItem.workflowInstanceId,
      comment,
    });
  };

  const formatStage = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const isPendingSignature = drawerItem?.stageKey === 'pending_signature';

  return (
    <div className="approval-inbox-page">
      <h1 className="approval-inbox-title">Approval Inbox</h1>

      {isLoading ? (
        <div className="skeleton-block" style={{ height: 200 }} />
      ) : error ? (
        <div className="approval-inbox-empty">
          <p style={{ color: '#B3261E' }}>Failed to load approvals. Please try again.</p>
        </div>
      ) : !inbox || inbox.length === 0 ? (
        <div className="approval-inbox-empty">
          <div className="approval-empty-icon">&#10003;</div>
          <p>No approvals pending your action right now.</p>
        </div>
      ) : (
        <div className="approval-inbox-list">
          {inbox.map((item) => {
            const contract = item.contract || {};
            const color = STAGE_COLORS[item.stageKey] || '#9AA1AC';
            const isActed = actedId === item._id;
            return (
              <div
                key={item._id}
                className={`approval-card ${isActed ? 'success-pulse' : ''}`}
                onClick={() => openDrawer(item)}
              >
                <div className="approval-card-left">
                  <span className="approval-stage-dot" style={{ backgroundColor: color }} />
                  <div className="approval-card-info">
                    <h3 className="approval-card-title">
                      {contract.title || 'Untitled Contract'}
                    </h3>
                    <div className="approval-card-meta">
                      <span className="approval-card-type">{contract.type?.replace('_', ' ')}</span>
                      <span className="approval-card-sep">|</span>
                      <span className="approval-card-stage" style={{ color }}>
                        {formatStage(item.stageKey)}
                      </span>
                      <span className="approval-card-sep">|</span>
                      {item.submittedBy && (
                        <>
                          <span className="approval-card-submitter">
                            Submitted by {item.submittedBy.name || 'Unknown'}
                          </span>
                          <span className="approval-card-sep">|</span>
                        </>
                      )}
                      <span className="approval-card-date">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="approval-card-action-hint">
                  {item.stageKey === 'pending_signature' ? 'Sign' : 'Review'} &rarr;
                </div>
              </div>
            );
          })}
        </div>
      )}

      {drawerItem && (
        <div className="approval-drawer-overlay" onClick={closeDrawer}>
          <div className="approval-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="approval-drawer-header">
              <h2 className="approval-drawer-title">
                {drawerItem.contract?.title || 'Untitled Contract'}
              </h2>
              <button className="approval-drawer-close" onClick={closeDrawer}>
                &times;
              </button>
            </div>

            <div className="approval-drawer-meta">
              <div className="approval-drawer-meta-row">
                <span className="approval-drawer-meta-label">Type</span>
                <span className="approval-drawer-meta-value">
                  {drawerItem.contract?.type?.replace('_', ' ') || '—'}
                </span>
              </div>
              <div className="approval-drawer-meta-row">
                <span className="approval-drawer-meta-label">Stage</span>
                <span
                  className="approval-drawer-meta-value"
                  style={{ color: STAGE_COLORS[drawerItem.stageKey] || '#9AA1AC' }}
                >
                  {formatStage(drawerItem.stageKey)}
                </span>
              </div>
              {drawerItem.submittedBy && (
                <div className="approval-drawer-meta-row">
                  <span className="approval-drawer-meta-label">Submitted by</span>
                  <span className="approval-drawer-meta-value">
                    {drawerItem.submittedBy.name} ({drawerItem.submittedBy.role})
                  </span>
                </div>
              )}
              <div className="approval-drawer-meta-row">
                <span className="approval-drawer-meta-label">Received</span>
                <span className="approval-drawer-meta-value">
                  {new Date(drawerItem.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="approval-drawer-preview">
              <h3 className="approval-drawer-section-title">Contract Preview</h3>
              <ContractPreview contractId={drawerItem.contract?._id} />
            </div>

            {isPendingSignature && (
              <div className="approval-drawer-signature">
                <DrawerSignatureSection
                  contractId={drawerItem.contract?._id}
                  user={user}
                  showSignaturePad={showSignaturePad}
                  setShowSignaturePad={setShowSignaturePad}
                  signMutation={signMutation}
                />
              </div>
            )}

            {!isPendingSignature && (
              <div className="approval-drawer-actions">
                {actionType ? (
                  <div className="approval-drawer-action-form">
                    <textarea
                      className="form-textarea"
                      placeholder={
                        actionType === 'approve'
                          ? 'Add an optional comment...'
                          : 'Add a comment (required when rejecting or requesting changes)...'
                      }
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="approval-drawer-action-btns">
                      <button
                        className={`btn btn-sm ${
                          actionType === 'approve'
                            ? 'btn-primary'
                            : actionType === 'reject'
                            ? 'btn-danger'
                            : 'btn-secondary'
                        }`}
                        onClick={handleConfirm}
                        disabled={actMutation.isPending}
                      >
                        {actMutation.isPending
                          ? 'Processing...'
                          : `Confirm ${
                              actionType === 'approve'
                                ? 'Approval'
                                : actionType === 'reject'
                                ? 'Rejection'
                                : 'Request Changes'
                            }`}
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => { setActionType(null); setComment(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="approval-drawer-action-btns">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setActionType('approve')}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setActionType('request_changes')}
                    >
                      Request Changes
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => setActionType('reject')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-sm btn-secondary approval-drawer-view-link"
              onClick={() => { closeDrawer(); navigate(`/contracts/${drawerItem.contract?._id}`); }}
            >
              View full contract &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawerSignatureSection({ contractId, user, showSignaturePad, setShowSignaturePad, signMutation }) {
  const { data: signatures } = useQuery({
    queryKey: ['signatureStatus', contractId],
    queryFn: () => signatureApi.getStatus(contractId).then((r) => r.data.data),
    enabled: !!contractId,
  });

  if (!signatures || signatures.length === 0) return null;

  const currentUserId = user?._id?.toString();
  const currentUserRole = user?.role;
  const mySignature = signatures.find((s) => {
    const signerIdStr = (s.signerId?._id || s.signerId)?.toString();
    if (signerIdStr === currentUserId) return true;
    if (currentUserRole === 'admin' && s.signerRole === 'admin' && s.status === 'pending') return true;
    if (currentUserRole === 'signatory' && s.signerRole === 'signatory' && s.status === 'pending') return true;
    return false;
  });
  const canSign = mySignature?.status === 'pending';
  const previousSigned = signatures.some(
    (s) => s.mode === 'sequential' && s.signOrder < (mySignature?.signOrder || 999) && s.status === 'signed'
  );
  const isSequentialBlocked = mySignature?.signOrder > 1 && !previousSigned;

  return (
    <div className="detail-card" style={{ margin: '0 16px 16px' }}>
      <h3 className="detail-card-title">Signatures</h3>

      <div className="signature-status-list" style={{ marginBottom: '12px' }}>
        {[...signatures].sort((a, b) => a.signOrder - b.signOrder).map((sig) => (
          <div key={sig._id} className="signature-status-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: sig.status === 'signed' ? '#2E7D4F' : sig.status === 'declined' ? '#B3261E' : '#9AA1AC',
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-primary)' }}>
              {sig.signerName}
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-secondary)', marginLeft: '4px' }}>
                ({sig.signerRole === 'admin' ? 'Admin' : 'External'})
              </span>
            </span>
            <span style={{
              fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px',
              backgroundColor: sig.status === 'signed' ? '#E8F5E9' : sig.status === 'declined' ? '#FFEBEE' : '#F5F5F5',
              color: sig.status === 'signed' ? '#2E7D4F' : sig.status === 'declined' ? '#B3261E' : '#9AA1AC',
            }}>
              {sig.status === 'signed' ? 'Signed' : sig.status === 'declined' ? 'Declined' : 'Pending'}
            </span>
            {sig.status === 'signed' && sig.signatureImageUrl && (
              <img src={sig.signatureImageUrl} alt="Signature" style={{ height: '20px', maxWidth: '60px', objectFit: 'contain' }} />
            )}
            {sig.signedAt && (
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-secondary)' }}>
                {new Date(sig.signedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ))}
      </div>

      {canSign && !showSignaturePad && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '8px' }}>
          {isSequentialBlocked
            ? 'Waiting for previous signatory to sign first.'
            : mySignature?.signerRole === 'admin'
            ? 'External signatory has signed. Please review and sign.'
            : 'Please review and digitally sign this contract.'}
        </p>
      )}

      {canSign && !showSignaturePad && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowSignaturePad(true)}
          disabled={isSequentialBlocked}
        >
          {isSequentialBlocked
            ? 'Waiting for Previous Signatory'
            : mySignature?.signerRole === 'admin'
            ? 'Sign Contract'
            : 'Approve & Sign'}
        </button>
      )}

      {showSignaturePad && canSign && (
        <SignaturePad
          contractId={contractId}
          onSign={(imageUrl) => signMutation.mutate({ contractId, signatureImageUrl: imageUrl })}
          onDecline={() => {
            if (contractId) {
              signatureApi.decline(contractId, 'Declined from approval inbox');
              setShowSignaturePad(false);
            }
          }}
          isSubmitting={signMutation.isPending}
        />
      )}
    </div>
  );
}

function ContractPreview({ contractId }) {
  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractApi.getContract(contractId).then((r) => r.data.data),
    enabled: !!contractId,
  });

  const { data: signatures } = useQuery({
    queryKey: ['signatureStatus', contractId],
    queryFn: () => signatureApi.getStatus(contractId).then((r) => r.data.data),
    enabled: !!contractId,
  });

  if (isLoading) {
    return <div className="skeleton-block" style={{ height: 120 }} />;
  }

  if (!contract) {
    return <p className="approval-drawer-preview-empty">Contract content unavailable.</p>;
  }

  let content = contract.currentVersionId?.content || '<p>No content yet.</p>';

  if (signatures && signatures.length > 0) {
    const sorted = [...signatures].sort((a, b) => a.signOrder - b.signOrder);
    const hasAnySigned = sorted.some((s) => s.status === 'signed');

    if (hasAnySigned) {
      const sigBlock = sorted.map((sig) => {
        const label = sig.signerRole === 'admin' ? 'Receiving Party (Admin)' : 'Disclosing Party';
        const signedDate = sig.status === 'signed' && sig.signedAt
          ? new Date(sig.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : '__________';
        const sigImg = sig.status === 'signed' && sig.signatureImageUrl
          ? `<img src="${sig.signatureImageUrl}" style="height:40px;max-width:150px;object-fit:contain;" />`
          : '________________________________________';
        const nameLine = sig.status === 'signed' ? sig.signerName : '';

        return `
          <div style="margin-top:16px;display:flex;gap:24px;">
            <div style="flex:1;">
              <div style="border-bottom:1px solid #1B2430;height:50px;margin-bottom:4px;"></div>
              <div style="font-size:10px;color:#5B6472;">${label}</div>
            </div>
            <div style="flex:1;">
              <div style="border-bottom:1px solid #1B2430;height:50px;margin-bottom:4px;display:flex;align-items:flex-end;padding:4px;">${sigImg}</div>
              <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <div style="font-size:10px;color:#5B6472;">${sig.status === 'signed' ? `Signed by: ${nameLine}` : 'Signature (pending)'}</div>
                <div style="font-size:10px;color:#5B6472;">Date: ${signedDate}</div>
              </div>
            </div>
          </div>`;
      }).join('');

      const sigSection = `
        <hr style="margin-top:24px;border:none;border-top:1px solid #D9D6CC;" />
        <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Signatures</h3>
        <p style="font-size:10px;color:#5B6472;margin-bottom:12px;">The parties have executed this agreement as of the dates indicated below.</p>
        ${sigBlock}`;

      const signedPattern = /Signed:\s*_+\s*_+[\s\S]*?Date:\s*_{10}\s+Date:\s*_{10}/i;
      if (signedPattern.test(content)) {
        content = content.replace(signedPattern, sigSection);
      } else {
        content = content + sigSection;
      }
    }
  }

  return (
    <div
      className="approval-drawer-preview-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default ApprovalInboxPage;
