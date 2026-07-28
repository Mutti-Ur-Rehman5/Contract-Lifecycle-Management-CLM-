import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractApi } from '../../features/contracts/contractApi.js';
import { workflowApi } from '../../features/workflows/workflowApi.js';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import RichTextEditor from '../../components/contract/RichTextEditor.jsx';
import VersionHistoryPanel from '../../components/contract/VersionHistoryPanel.jsx';
import SignaturePad from '../../components/signature/SignaturePad.jsx';
import SignatureStatusPanel from '../../components/signature/SignatureStatusPanel.jsx';
import '../../styles/pages/contract-detail.css';

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

function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const { data: contract, isLoading, error: contractError } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractApi.getContract(id).then((r) => r.data.data),
  });

  const { data: workflow } = useQuery({
    queryKey: ['contractWorkflow', id],
    queryFn: () => workflowApi.getWorkflowForContract(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: versions } = useQuery({
    queryKey: ['contractVersions', id],
    queryFn: () => contractApi.getContractVersions(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const latestVersion = versions?.[0];

  const currentStageKey = workflow?.instance?.currentStageKey || contract?.status;

  const { data: signatureStatus } = useQuery({
    queryKey: ['signatureStatus', id],
    queryFn: () => signatureApi.getStatus(id).then((r) => r.data.data),
    enabled: !!id,
  });

  const contractContentWithSignatures = useMemo(() => {
    let content = contract?.currentVersionId?.content || '<p>No content yet.</p>';
    if (!signatureStatus || signatureStatus.length === 0) return content;

    const hasAnySigned = signatureStatus.some((s) => s.status === 'signed');
    if (!hasAnySigned) return content;

    const sorted = [...signatureStatus].sort((a, b) => a.signOrder - b.signOrder);
    const sigBlock = sorted.map((sig) => {
      const label = sig.signerRole === 'admin' ? 'Receiving Party (Admin)' : 'Disclosing Party';
      const signedDate = sig.status === 'signed' && sig.signedAt
        ? new Date(sig.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '__________';
      const sigImg = sig.status === 'signed' && sig.signatureImageUrl
        ? `<img src="${sig.signatureImageUrl}" style="height:50px;max-width:180px;object-fit:contain;" />`
        : '________________________________________';
      const nameLine = sig.status === 'signed' ? `Signed by: ${sig.signerName}` : 'Signature (pending)';

      return `
        <div style="margin-top:24px;display:flex;gap:32px;">
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1B2430;height:60px;margin-bottom:4px;"></div>
            <div style="font-size:10px;color:#5B6472;">${label}</div>
          </div>
          <div style="flex:1;">
            <div style="border-bottom:1px solid #1B2430;height:60px;margin-bottom:4px;display:flex;align-items:flex-end;padding:4px;">${sigImg}</div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
              <div style="font-size:10px;color:#5B6472;">${nameLine}</div>
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
    return content;
  }, [contract, signatureStatus]);

  const ownerUserId = (contract?.ownerId?._id || contract?.ownerId)?.toString();
  const currentUserId = user?._id?.toString();
  const currentUserRole = user?.role;

  const mySignature = signatureStatus?.find((s) => {
    const signerIdStr = (s.signerId?._id || s.signerId)?.toString();
    if (signerIdStr === currentUserId) return true;
    if (currentUserRole === 'admin' && s.signerRole === 'admin' && s.status === 'pending') return true;
    if (currentUserRole === 'signatory' && s.signerRole === 'signatory' && s.status === 'pending') return true;
    return false;
  });

  const canCurrentUserSign = mySignature?.status === 'pending';

  const previousSigned = signatureStatus?.some(
    (s) => s.mode === 'sequential' && s.signOrder < (mySignature?.signOrder || 999) && s.status === 'signed'
  );
  const isSequentialBlocked = mySignature?.signOrder > 1 && !previousSigned;

  const workflowStages = useMemo(() => {
    if (workflow?.currentStage?.stages) {
      return workflow.currentStage.stages.sort((a, b) => a.order - b.order);
    }
    return [];
  }, [workflow]);

  useEffect(() => {
    if (contract?.currentVersionId?.content) {
      setEditContent(contract.currentVersionId.content);
    }
  }, [contract]);

  const saveMutation = useMutation({
    mutationFn: (data) => contractApi.saveContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setEditing(false);
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => workflowApi.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contractWorkflow', id] });
    },
  });

  const signMutation = useMutation({
    mutationFn: (signatureImageUrl) => signatureApi.sign(id, signatureImageUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatureStatus', id] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['contractWorkflow', id] });
      setShowSignaturePad(false);
    },
  });

  const declineMutation = useMutation({
    mutationFn: (comment) => signatureApi.decline(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatureStatus', id] });
      setShowSignaturePad(false);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ content: editContent, changeSummary: 'Edited from detail page' });
  };

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      await contractApi.generatePdf(id);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const freshVersions = await contractApi.getContractVersions(id).then((r) => r.data.data);
          queryClient.setQueryData(['contractVersions', id], freshVersions);
          const latest = freshVersions?.[0];
          if (latest?.pdfFileUrl || attempts >= 20) {
            clearInterval(poll);
            setPdfLoading(false);
          }
        } catch {
          if (attempts >= 20) {
            clearInterval(poll);
            setPdfLoading(false);
          }
        }
      }, 3000);
    } catch {
      setPdfLoading(false);
    }
  };

  const handleDownloadPdf = async (versionId, versionNumber) => {
    try {
      const response = await contractApi.downloadPdf(id, versionId);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.title || 'contract'}-v${versionNumber || versionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
    }
  };

  if (isLoading) {
    return (
      <div className="detail-page">
        <div className="skeleton-block" style={{ height: 40, width: '60%', marginBottom: 24 }} />
        <div className="detail-layout">
          <div className="skeleton-block" style={{ height: 400 }} />
          <div className="skeleton-block" style={{ height: 300 }} />
        </div>
      </div>
    );
  }

  if (contractError) {
    return (
      <div className="detail-page">
        <p className="empty-cell" style={{ color: '#B3261E' }}>Failed to load contract. Please try again.</p>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/contracts')}>
          Back to Contracts
        </button>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="detail-page">
        <p className="empty-cell">Contract not found.</p>
      </div>
    );
  }

  const stageIndex = workflowStages.findIndex((s) => s.key === currentStageKey);

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/contracts')}>
          &larr; Back
        </button>
        <div className="detail-actions">
          {!editing && contract.status === 'draft' && !workflow?.instance && (
            <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
          {editing && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </>
          )}
          {contract.status === 'draft' && (!workflow?.instance || (workflow?.instance?.status === 'in_progress' && workflow?.currentStage?.stageKey === 'draft')) && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : (workflow?.instance ? 'Resubmit for Approval' : 'Submit for Approval')}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleGeneratePdf} disabled={pdfLoading}>
            {pdfLoading ? 'Generating...' : 'Generate PDF'}
          </button>
          {latestVersion?.pdfFileUrl && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleDownloadPdf(latestVersion._id, latestVersion.versionNumber)}
            >
              Download PDF
            </button>
          )}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-document">
          <h1 className="detail-title">{contract.title}</h1>

          {workflowStages.length > 0 && (
            <div className="stage-rail">
              {workflowStages.map((stage, i) => {
                const color = STAGE_COLORS[stage.key] || '#9AA1AC';
                const isActive = stage.key === currentStageKey;
                const isPast = stageIndex >= 0 && i < stageIndex;
                const isRejected = contract.status === 'rejected';

                return (
                  <div key={stage.key} className={`stage-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
                    <div
                      className="stage-indicator"
                      style={{
                        backgroundColor: isActive ? color : isPast ? color : 'transparent',
                        borderColor: isPast || isActive ? color : 'var(--border-hairline)',
                      }}
                    >
                      {isPast ? '✓' : ''}
                    </div>
                    <span
                      className="stage-label"
                      style={{
                        color: isActive ? color : isPast || isRejected ? 'var(--ink-secondary)' : 'var(--ink-faint)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {stage.label}
                    </span>
                    {i < workflowStages.length - 1 && (
                      <div
                        className="stage-connector"
                        style={{ backgroundColor: isPast ? color : 'var(--border-hairline)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="detail-content">
            {editing ? (
              <RichTextEditor
                content={editContent}
                onChange={setEditContent}
                editable
              />
            ) : (
              <div
                className="detail-content-display"
                dangerouslySetInnerHTML={{ __html: contractContentWithSignatures }}
              />
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="detail-sidebar-inner">
            <div className="detail-card">
              <h3 className="detail-card-title">Status</h3>
              <div className="detail-status-row">
                <span
                  className="status-badge-lg"
                  style={{ backgroundColor: STAGE_COLORS[currentStageKey] || '#9AA1AC' }}
                />
                <span className="detail-status-label">
                  {workflowStages.find((s) => s.key === currentStageKey)?.label ||
                    currentStageKey?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              </div>
            </div>

            <SignatureStatusPanel contractId={id} />

            {currentStageKey === 'pending_signature' && !showSignaturePad && canCurrentUserSign && (
              <div className="detail-card">
                <h3 className="detail-card-title">Signature Required</h3>
                <p className="detail-card-subtitle" style={{ fontSize: '0.8rem', color: 'var(--ink-secondary)', marginBottom: '0.5rem' }}>
                  {isSequentialBlocked
                    ? 'Waiting for previous signatory to sign first.'
                    : mySignature?.signerRole === 'admin'
                    ? 'External signatory has signed. Please review and sign.'
                    : 'Please review and approve this contract.'}
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowSignaturePad(true)}
                  disabled={isSequentialBlocked}
                >
                  {isSequentialBlocked
                    ? 'Waiting for External Signatory'
                    : mySignature?.signerRole === 'admin'
                    ? 'Sign Contract'
                    : 'Approve & Sign'}
                </button>
              </div>
            )}

            {currentStageKey === 'pending_signature' && showSignaturePad && (
              <div className="detail-card">
                <h3 className="detail-card-title">Sign Contract</h3>
                <SignaturePad
                  contractId={id}
                  onSign={(imageUrl) => signMutation.mutate(imageUrl)}
                  onDecline={() => declineMutation.mutate('Declined by signatory')}
                  isSubmitting={signMutation.isPending || declineMutation.isPending}
                />
              </div>
            )}

            {workflow?.steps?.length > 0 && (
              <div className="detail-card">
                <h3 className="detail-card-title">Approval History</h3>
                <div className="approval-history">
                  {[...workflow.steps].reverse().map((step) => (
                    <div key={step._id} className="approval-history-item">
                      <span
                        className={`approval-history-status ${step.status}`}
                      >
                        {step.status === 'approved' ? 'Approved' : step.status === 'rejected' ? 'Rejected' : step.status}
                      </span>
                      <span className="approval-history-stage">
                        {step.stageKey?.replace(/_/g, ' ')}
                      </span>
                      {step.comment && <p className="approval-history-comment">{step.comment}</p>}
                      {step.decidedAt && (
                        <span className="approval-history-date">
                          {new Date(step.decidedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-card">
              <h3 className="detail-card-title">Details</h3>
              <div className="detail-info">
                <div className="detail-info-row">
                  <span className="detail-info-label">Type</span>
                  <span className="detail-info-value">{contract.type?.replace('_', ' ')}</span>
                </div>
                <div className="detail-info-row">
                  <span className="detail-info-label">Owner</span>
                  <span className="detail-info-value">{contract.ownerId?.name || '—'}</span>
                </div>
                {contract.templateId && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">Template</span>
                    <span className="detail-info-value">{contract.templateId?.name || '—'}</span>
                  </div>
                )}
                {contract.startDate && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">Start date</span>
                    <span className="detail-info-value">{new Date(contract.startDate).toLocaleDateString()}</span>
                  </div>
                )}
                {contract.endDate && (
                  <div className="detail-info-row">
                    <span className="detail-info-label">End date</span>
                    <span className="detail-info-value">{new Date(contract.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {contract.parties?.length > 0 && (
              <div className="detail-card">
                <h3 className="detail-card-title">Parties</h3>
                {contract.parties.map((p, i) => (
                  <div key={i} className="party-row">
                    <span className="party-name">{p.name}</span>
                    {p.role && <span className="party-role">{p.role}</span>}
                  </div>
                ))}
              </div>
            )}

            <VersionHistoryPanel contractId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContractDetailPage;
