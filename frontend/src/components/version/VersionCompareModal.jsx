import { useQuery } from '@tanstack/react-query';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import '../../styles/components/version-compare.css';

function VersionCompareModal({ contractId, versionAId, versionBId, onClose }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['versionCompare', contractId, versionAId, versionBId],
    queryFn: () => signatureApi.compareVersions(contractId, versionAId, versionBId).then((r) => r.data.data),
    enabled: !!contractId && !!versionAId && !!versionBId,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card version-compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Compare Versions</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {isLoading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faint)' }}>
            Loading comparison...
          </div>
        )}

        {error && (
          <div style={{ padding: 24, textAlign: 'center', color: '#B3261E' }}>
            Failed to load comparison. Please try again.
          </div>
        )}

        {!isLoading && !error && !data && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)' }}>
            Could not load comparison data.
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <div className="version-compare-meta">
              <div className="version-compare-side">
                <span className="version-compare-label">v{data.versionA.number} (older)</span>
                <span className="version-compare-date">
                  {new Date(data.versionA.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {data.versionA.changeSummary && (
                  <p className="version-compare-summary">{data.versionA.changeSummary}</p>
                )}
              </div>
              <div className="version-compare-arrow">→</div>
              <div className="version-compare-side">
                <span className="version-compare-label">v{data.versionB.number} (newer)</span>
                <span className="version-compare-date">
                  {new Date(data.versionB.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                {data.versionB.changeSummary && (
                  <p className="version-compare-summary">{data.versionB.changeSummary}</p>
                )}
              </div>
            </div>

            <div className="version-compare-stats">
              <span className="diff-stat added">+{data.stats.additions} lines added</span>
              <span className="diff-stat removed">-{data.stats.removals} lines removed</span>
              <span className="diff-stat unchanged">{data.stats.unchanged} unchanged</span>
            </div>

            <div className="version-compare-diff">
              {data.diff.length === 0 && (
                <p style={{ padding: 24, textAlign: 'center', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                  No differences found between these versions.
                </p>
              )}
              {data.diff.map((line, i) => (
                <div key={i} className={`diff-line diff-${line.type}`}>
                  <span className="diff-line-marker">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span className="diff-line-text">{line.text || ' '}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VersionCompareModal;
