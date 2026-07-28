import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractApi } from '../../features/contracts/contractApi.js';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import VersionCompareModal from '../version/VersionCompareModal.jsx';
import '../../styles/components/panel.css';

function VersionHistoryPanel({ contractId }) {
  const queryClient = useQueryClient();
  const [compareIds, setCompareIds] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['contractVersions', contractId],
    queryFn: () => contractApi.getContractVersions(contractId).then((r) => r.data.data),
    enabled: !!contractId,
  });

  const restoreMutation = useMutation({
    mutationFn: (targetVersionId) => signatureApi.rollbackVersion(contractId, targetVersionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractVersions', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      setRestoreTarget(null);
    },
  });

  const handleDownloadPdf = async (versionId, versionNumber) => {
    try {
      const response = await contractApi.downloadPdf(contractId, versionId);
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-v${versionNumber || versionId}.pdf`;
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
      <div className="panel">
        <h3 className="panel-title">Version History</h3>
        <p className="panel-empty">Loading versions...</p>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">Version History</h3>
        <p className="panel-empty">No versions yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="panel">
        <h3 className="panel-title">Version History</h3>
        <p className="panel-hint">
          Every save creates a new version. You can compare changes or restore an older version.
        </p>

        {versions.length >= 2 && (
          <button
            className="btn btn-sm btn-ghost version-compare-trigger"
            onClick={() => setCompareIds({ a: versions[1]._id, b: versions[0]._id })}
          >
            See changes between latest versions
          </button>
        )}

        <div className="version-timeline">
          {versions.map((v, idx) => {
            const isLatest = idx === 0;
            const isLast = idx === versions.length - 1;
            return (
              <div key={v._id} className={`version-entry ${isLatest ? 'version-entry--latest' : ''}`}>
                <div className="version-entry-dot-wrapper">
                  <div className={`version-entry-dot ${isLatest ? 'version-entry-dot--active' : ''}`} />
                  {!isLast && <div className="version-entry-line" />}
                </div>
                <div className="version-entry-content">
                  <div className="version-entry-header">
                    <span className="version-entry-number">
                      v{v.versionNumber}
                      {isLatest && <span className="version-latest-badge">Current</span>}
                    </span>
                    <span className="version-entry-date">
                      {new Date(v.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {v.changeSummary && (
                    <p className="version-entry-summary">{v.changeSummary}</p>
                  )}
                  <div className="version-entry-actions">
                    {v.pdfFileUrl && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => handleDownloadPdf(v._id, v.versionNumber)}
                      >
                        Download PDF
                      </button>
                    )}
                    {!isLatest && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setRestoreTarget(v)}
                      >
                        Restore this version
                      </button>
                    )}
                    {!isLatest && versions.length >= 2 && (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                          const prevVersion = versions[idx - 1];
                          if (prevVersion) setCompareIds({ a: prevVersion._id, b: v._id });
                          else setCompareIds({ a: versions[versions.length - 1]._id, b: v._id });
                        }}
                      >
                        See changes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {restoreTarget && (
        <div className="modal-overlay" onClick={() => setRestoreTarget(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Restore v{restoreTarget.versionNumber}?</h3>
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                This will create a <strong>new version (v{versions[0].versionNumber + 1})</strong> using the content from
                v{restoreTarget.versionNumber}. Nothing gets deleted — all versions stay in history.
              </p>
              <div style={{
                padding: '10px 14px',
                background: 'var(--bg-surface-muted)',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--ink-secondary)',
              }}>
                <strong>What happens next:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  <li>Current content (v{versions[0].versionNumber}) stays in history as v{versions[0].versionNumber}</li>
                  <li>New version v{versions[0].versionNumber + 1} is created with v{restoreTarget.versionNumber}'s content</li>
                  <li>This new version becomes the active version of the contract</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setRestoreTarget(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => restoreMutation.mutate(restoreTarget._id)}
                disabled={restoreMutation.isPending}
              >
                {restoreMutation.isPending ? 'Restoring...' : `Restore v${restoreTarget.versionNumber}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {compareIds && (
        <VersionCompareModal
          contractId={contractId}
          versionAId={compareIds.a}
          versionBId={compareIds.b}
          onClose={() => setCompareIds(null)}
        />
      )}
    </>
  );
}

export default VersionHistoryPanel;
