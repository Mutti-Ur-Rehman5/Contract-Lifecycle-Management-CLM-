import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth.js';
import { contractApi } from '../../features/contracts/contractApi.js';
import RichTextEditor from '../../components/contract/RichTextEditor.jsx';
import ClauseLibraryPanel from '../../components/contract/ClauseLibraryPanel.jsx';
import VariableInserter from '../../components/contract/VariableInserter.jsx';
import CountrySelect from '../../components/common/CountrySelect.jsx';
import '../../styles/pages/contract-builder.css';

function getVariableType(varName) {
  const lower = varName.toLowerCase();
  if (lower.includes('date') || lower.includes('deadline') || lower.includes('expiry') || lower.includes('effective') || lower.includes('termination')) return 'date';
  if (lower.includes('country') || lower.includes('nation') || lower.includes('jurisdiction') || lower.includes('governing_law') || lower.includes('justification') || lower.includes('region') || lower.includes('location')) return 'country';
  if (lower.includes('amount') || lower.includes('price') || lower.includes('cost') || lower.includes('fee') || lower.includes('value') || lower.includes('salary') || lower.includes('payment')) return 'number';
  if (lower.includes('email') || lower.includes('mail')) return 'email';
  if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile')) return 'tel';
  return 'text';
}

function VariableField({ varName, value, onChange }) {
  const type = getVariableType(varName);
  const label = varName.replace(/_/g, ' ');

  if (type === 'date') {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          className="form-input var-input-date"
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (type === 'country') {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <CountrySelect
          value={value || ''}
          onChange={onChange}
          placeholder={`Select ${label}`}
        />
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type === 'number' ? 'number' : type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label}`}
        step={type === 'number' ? 'any' : undefined}
      />
    </div>
  );
}

function ContractBuilderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canCreateContracts = user?.role === 'admin' || user?.role === 'drafter';
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');

  const [step, setStep] = useState(templateId ? 'variables' : 'select');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variables, setVariables] = useState({});
  const [editorContent, setEditorContent] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [contractId, setContractId] = useState(null);
  const [showClausePanel, setShowClausePanel] = useState(false);
  const [showVarPanel, setShowVarPanel] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: templates, isLoading: templatesLoading, error: templatesError } = useQuery({
    queryKey: ['templates'],
    queryFn: () => contractApi.getTemplates().then((r) => r.data.data),
  });

  const { data: templateVars } = useQuery({
    queryKey: ['templateVars', selectedTemplate?._id],
    queryFn: () => contractApi.getTemplateVariables(selectedTemplate._id).then((r) => r.data.data),
    enabled: !!selectedTemplate,
  });

  const createMutation = useMutation({
    mutationFn: (data) => contractApi.createFromTemplate(data),
    onSuccess: (res) => {
      const contract = res.data.data;
      setContractId(contract._id);
      setEditorContent(contract.currentVersionId?.content || '');
      setContractTitle(contract.title);
      setStep('edit');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => contractApi.saveContract(contractId, data),
  });

  const handleSelectTemplate = (tmpl) => {
    setSelectedTemplate(tmpl);
    const vars = {};
    // Extract unique variable names from the template content
    const matches = tmpl.contentTemplate?.match(/\{\{(\w+)\}\}/g) || [];
    [...new Set(matches)].forEach((m) => {
      vars[m.replace(/\{\{|\}\}/g, '')] = '';
    });
    setVariables(vars);
    // Auto-fill title from template
    if (!contractTitle) setContractTitle(`New ${tmpl.contractType} contract`);
    setStep('variables');
  };

  const handleCreateContract = () => {
    createMutation.mutate({
      templateId: selectedTemplate._id,
      title: contractTitle,
      variables,
    });
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      content: editorContent,
      changeSummary: 'Edited in builder',
    });
  };

  const handleInsertClause = useCallback((clauseContent, clauseTitle) => {
    const wrapped = `<div class="clause"><p class="clause-title"><strong>${clauseTitle}</strong></p>${clauseContent}</div>`;
    setEditorContent((prev) => prev + wrapped);
  }, []);

  const handleInsertVariable = useCallback((varName) => {
    setEditorContent((prev) => prev + `<p>{{${varName}}}</p>`);
  }, []);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      await contractApi.generatePdf(contractId);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const freshVersions = await contractApi.getContractVersions(contractId).then((r) => r.data.data);
          queryClient.setQueryData(['contractVersions', contractId], freshVersions);
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

  if (!canCreateContracts) {
    return (
      <div className="builder-page">
        <div className="builder-step">
          <h1 className="page-title">New Contract</h1>
          <p className="builder-subtitle" style={{ color: 'var(--ink-secondary)', marginTop: 16 }}>
            You don't have permission to create contracts. Only Admin and Drafter roles can author new contracts.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 24 }} onClick={() => navigate('/contracts')}>
            Back to Contract Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="builder-page">
      {/* Step 1: Select template */}
      {step === 'select' && (
        <div className="builder-step">
          <h1 className="page-title">New Contract</h1>
          <p className="builder-subtitle">Choose a template to get started.</p>
          <div className="template-grid">
            {templatesLoading && (
              <div className="empty-cell" style={{ gridColumn: '1 / -1' }}>Loading templates...</div>
            )}
            {templatesError && !templatesLoading && (
              <div className="empty-cell" style={{ gridColumn: '1 / -1', color: '#B3261E' }}>Failed to load templates.</div>
            )}
            {!templatesLoading && !templatesError && (templates || []).map((t) => (
              <div
                key={t._id}
                className="template-card"
                onClick={() => handleSelectTemplate(t)}
              >
                <h3 className="template-card-title">{t.name}</h3>
                <p className="template-card-type">{t.contractType?.replace('_', ' ')}</p>
              </div>
            ))}
            {(!templates || templates.length === 0) && (
              <p className="empty-cell">No templates available. Ask an admin to create one.</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Fill variables */}
      {step === 'variables' && selectedTemplate && (
        <div className="builder-step">
          <h1 className="page-title">Fill Variables</h1>
          <div className="var-form">
            <div className="form-group">
              <label className="form-label">Contract title</label>
              <input
                className="form-input"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                required
              />
            </div>
            {templateVars?.length > 0 && (
              <p className="builder-hint">Fill in the variables for this template.</p>
            )}
            {templateVars?.length === 0 && (
              <p className="builder-hint">This template has no variables. Continue to edit.</p>
            )}
            {templateVars?.map((v) => (
              <VariableField
                key={v}
                varName={v}
                value={variables[v] || ''}
                onChange={(val) => setVariables((prev) => ({ ...prev, [v]: val }))}
              />
            ))}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleCreateContract} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create contract'}
              </button>
              <button className="btn btn-secondary" onClick={() => setStep('select')}>Back</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Edit contract */}
      {step === 'edit' && (
        <div className="builder-edit">
          <div className="builder-header">
            <div>
              <h1 className="page-title">{contractTitle}</h1>
              <div className="builder-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowClausePanel((p) => !p)}>
                  Clauses
                </button>
                <button className="btn btn-secondary" onClick={() => setShowVarPanel((p) => !p)}>
                  Variables
                </button>
                <button className="btn btn-secondary" onClick={handleGeneratePdf} disabled={pdfLoading}>
                  {pdfLoading ? 'Generating PDF...' : 'Generate PDF'}
                </button>
              </div>
            </div>
            <div className="builder-status">
              {saveMutation.isSuccess && <span className="save-success">Saved</span>}
            </div>
          </div>

          <div className="builder-layout">
            <div className="builder-editor">
              <RichTextEditor
                content={editorContent}
                onChange={setEditorContent}
                placeholder="Start editing your contract..."
              />
            </div>
            <div className="builder-sidebar">
              {showClausePanel && (
                <ClauseLibraryPanel onInsertClause={handleInsertClause} />
              )}
              {showVarPanel && (
                <VariableInserter
                  onInsertVariable={handleInsertVariable}
                  templateVariables={templateVars}
                />
              )}
              {!showClausePanel && !showVarPanel && (
                <div className="builder-sidebar-hint">
                  <p>Use the buttons above to open the clause library and variable inserter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractBuilderPage;
