import { useState } from 'react';
import '../../styles/components/contract-detail.css';

function ApprovalActionCard({ workflowInstanceId, onAction, isPending }) {
  const [activeAction, setActiveAction] = useState(null);
  const [comment, setComment] = useState('');

  const handleAction = (type) => {
    setActiveAction(type);
  };

  const handleConfirm = () => {
    onAction(activeAction, comment);
    setActiveAction(null);
    setComment('');
  };

  const handleCancel = () => {
    setActiveAction(null);
    setComment('');
  };

  if (!workflowInstanceId) return null;

  return (
    <div className="detail-card">
      <h3 className="detail-card-title">Workflow Actions</h3>
      {activeAction ? (
        <div className="workflow-action-form">
          <textarea
            className="form-textarea"
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <div className="workflow-action-btns">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleConfirm}
              disabled={isPending}
            >
              Confirm {activeAction === 'approve' ? 'Approval' : activeAction === 'reject' ? 'Rejection' : 'Request'}
            </button>
            <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="workflow-action-btns">
          <button className="btn btn-sm btn-primary" onClick={() => handleAction('approve')}>
            Approve
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleAction('request_changes')}>
            Request Changes
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleAction('reject')}>
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

export default ApprovalActionCard;
