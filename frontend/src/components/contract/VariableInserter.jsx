import '../../styles/components/panel.css';

const COMMON_VARIABLES = [
  { name: 'party_name', label: 'Party Name' },
  { name: 'party_address', label: 'Party Address' },
  { name: 'counterparty_name', label: 'Counterparty Name' },
  { name: 'contract_date', label: 'Contract Date' },
  { name: 'start_date', label: 'Start Date' },
  { name: 'end_date', label: 'End Date' },
  { name: 'effective_date', label: 'Effective Date' },
  { name: 'governing_law', label: 'Governing Law' },
  { name: 'jurisdiction', label: 'Jurisdiction' },
  { name: 'payment_amount', label: 'Payment Amount' },
  { name: 'payment_terms', label: 'Payment Terms' },
  { name: 'renewal_period', label: 'Renewal Period' },
  { name: 'notice_period', label: 'Notice Period' },
  { name: 'signatory_title', label: 'Signatory Title' },
];

function VariableInserter({ onInsertVariable, templateVariables }) {
  const vars = templateVariables || COMMON_VARIABLES.map((v) => v.name);
  const variableMeta = COMMON_VARIABLES.reduce((acc, v) => {
    acc[v.name] = v.label;
    return acc;
  }, {});

  return (
    <div className="panel">
      <h3 className="panel-title">Variables</h3>
      <p className="panel-hint">Click a variable to insert it into the document.</p>
      <div className="panel-list">
        {vars.length === 0 && <p className="panel-empty">No variables in this template.</p>}
        {vars.map((v) => (
          <button
            key={v}
            className="panel-var-btn"
            onClick={() => onInsertVariable(v)}
            title={variableMeta[v] || v}
          >
            <code>{`{{${v}}}`}</code>
            <span className="panel-var-label">{variableMeta[v] || v}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default VariableInserter;
