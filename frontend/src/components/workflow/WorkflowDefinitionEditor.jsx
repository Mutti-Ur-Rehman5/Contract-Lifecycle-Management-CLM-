import { useState } from 'react';
import '../../styles/components/workflow-definition-editor.css';

const ROLE_OPTIONS = [
  { value: 'drafter', label: 'Drafter' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'legal', label: 'Legal' },
  { value: 'finance', label: 'Finance' },
  { value: 'executive', label: 'Executive' },
  { value: 'signatory', label: 'Signatory' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'admin', label: 'Admin' },
];

const CONTRACT_TYPES = [
  { value: 'employment', label: 'Employment' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'nda', label: 'NDA' },
  { value: 'service', label: 'Service' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'client', label: 'Client' },
];

function emptyStage() {
  return { key: '', label: '', approverRole: 'reviewer', isRequired: true };
}

function WorkflowDefinitionEditor({ initial, onSubmit, onCancel, error }) {
  const [name, setName] = useState(initial?.name || '');
  const [contractType, setContractType] = useState(initial?.contractType || '');
  const [stages, setStages] = useState(
    initial?.stages?.length
      ? initial.stages.map((s) => ({ ...s }))
      : [emptyStage()]
  );

  const addStage = () => setStages([...stages, emptyStage()]);
  const removeStage = (i) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((_, idx) => idx !== i));
  };
  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...stages];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setStages(next);
  };
  const moveDown = (i) => {
    if (i === stages.length - 1) return;
    const next = [...stages];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    setStages(next);
  };
  const updateStage = (i, field, value) => {
    const next = [...stages];
    next[i] = { ...next[i], [field]: value };
    if (field === 'label' && !next[i].key) {
      next[i].key = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    setStages(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = stages.every((s) => s.key && s.label && s.approverRole);
    if (!valid) return;
    onSubmit({ name, contractType, stages });
  };

  return (
    <form className="wf-def-editor" onSubmit={handleSubmit}>
      {error && <div className="auth-error">{error}</div>}

      <div className="wf-def-fields">
        <div className="wf-def-field">
          <label className="wf-def-label">Name</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Approval Workflow"
            required
          />
        </div>
        <div className="wf-def-field">
          <label className="wf-def-label">Contract Type</label>
          <select
            className="form-input"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            required
            disabled={!!initial}
          >
            <option value="">Select type...</option>
            {CONTRACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="wf-def-stages-header">
        <h4 className="wf-def-stages-title">Stages</h4>
        <button type="button" className="btn btn-sm btn-secondary" onClick={addStage}>
          + Add stage
        </button>
      </div>

      <div className="wf-def-stages">
        {stages.map((stage, i) => (
          <div key={i} className="wf-def-stage-row">
            <div className="wf-def-stage-order">
              <span className="wf-def-stage-num">{i + 1}</span>
              <div className="wf-def-stage-move">
                <button type="button" className="wf-def-move-btn" onClick={() => moveUp(i)} disabled={i === 0}>
                  &#9650;
                </button>
                <button type="button" className="wf-def-move-btn" onClick={() => moveDown(i)} disabled={i === stages.length - 1}>
                  &#9660;
                </button>
              </div>
            </div>
            <div className="wf-def-stage-inputs">
              <input
                className="form-input"
                placeholder="Stage key (e.g. legal_review)"
                value={stage.key}
                onChange={(e) => updateStage(i, 'key', e.target.value)}
                required
              />
              <input
                className="form-input"
                placeholder="Label (e.g. Legal Review)"
                value={stage.label}
                onChange={(e) => updateStage(i, 'label', e.target.value)}
                required
              />
              <select
                className="form-input"
                value={stage.approverRole}
                onChange={(e) => updateStage(i, 'approverRole', e.target.value)}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <label className="wf-def-checkbox-label">
                <input
                  type="checkbox"
                  checked={stage.isRequired}
                  onChange={(e) => updateStage(i, 'isRequired', e.target.checked)}
                />
                Required
              </label>
            </div>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => removeStage(i)} disabled={stages.length <= 1}>
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="wf-def-actions">
        <button type="submit" className="btn btn-primary">
          {initial ? 'Update' : 'Create'} Definition
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default WorkflowDefinitionEditor;
