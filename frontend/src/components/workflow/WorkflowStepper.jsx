import '../../styles/components/contract-detail.css';

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

function WorkflowStepper({ stages, currentStageKey, contractStatus }) {
  const stageIndex = stages.findIndex((s) => s.key === currentStageKey);
  const isRejected = contractStatus === 'rejected';

  return (
    <div className="stage-rail">
      {stages.map((stage, i) => {
        const color = STAGE_COLORS[stage.key] || '#9AA1AC';
        const isActive = stage.key === currentStageKey;
        const isPast = stageIndex >= 0 && i < stageIndex;

        return (
          <div key={stage.key} className={`stage-step ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}>
            <div
              className="stage-indicator"
              style={{
                backgroundColor: isActive ? color : isPast ? color : 'transparent',
                borderColor: isPast || isActive ? color : 'var(--border-hairline)',
              }}
            >
              {isPast ? '\u2713' : ''}
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
            {i < stages.length - 1 && (
              <div
                className="stage-connector"
                style={{ backgroundColor: isPast ? color : 'var(--border-hairline)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default WorkflowStepper;
