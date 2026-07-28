import { useState, useRef, useCallback, useEffect } from 'react';
import { signatureApi } from '../../features/signatures/signatureApi.js';
import '../../styles/components/signature-pad.css';

function SignaturePad({ contractId, onSign, onDecline, isSubmitting }) {
  const [mode, setMode] = useState('draw');
  const [typedName, setTypedName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef(null);

  const getCanvasPoint = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getCanvasPoint(e);
  }, [getCanvasPoint]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasPoint(e);
    if (!point || !lastPoint.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = '#1B2430';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = point;
    setHasDrawn(true);
  }, [getCanvasPoint]);

  const endDraw = useCallback((e) => {
    e.preventDefault();
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateTypedSignature = () => {
    if (!typedName.trim()) return null;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 100);
    ctx.font = "48px 'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive";
    ctx.fillStyle = '#1B2430';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName.trim(), 20, 50);
    return canvas.toDataURL('image/png');
  };

  const getDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return null;
    return canvas.toDataURL('image/png');
  };

  const handleConfirm = async () => {
    if (isSubmitting || uploading) return;

    let imageDataUrl = null;
    if (mode === 'draw') {
      imageDataUrl = getDrawnSignature();
    } else {
      imageDataUrl = generateTypedSignature();
    }

    if (!imageDataUrl) return;

    setUploading(true);
    try {
      onSign(imageDataUrl);
    } catch (err) {
      setUploading(false);
      const msg = err?.response?.data?.error?.message || err?.message || 'Sign failed';
      alert('Failed to sign: ' + msg);
    }
  };

  const canConfirm =
    confirmed &&
    ((mode === 'draw' && hasDrawn) || (mode === 'type' && typedName.trim())) &&
    !isSubmitting &&
    !uploading;

  return (
    <div className="signature-pad">
      <div className="signature-pad-tabs">
        <button
          className={`signature-pad-tab ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => setMode('draw')}
        >
          Draw
        </button>
        <button
          className={`signature-pad-tab ${mode === 'type' ? 'active' : ''}`}
          onClick={() => setMode('type')}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="signature-pad-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={400}
            height={120}
            className="signature-pad-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasDrawn && (
            <div className="signature-pad-canvas-hint">Draw your signature above</div>
          )}
          <button
            className="btn btn-sm btn-secondary"
            onClick={clearCanvas}
            disabled={!hasDrawn}
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="signature-pad-type-wrapper">
          <input
            className="form-input signature-name-input"
            placeholder="Type your full name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            autoFocus
          />
          {typedName.trim() && (
            <div className="signature-pad-type-preview">
              <span className="signature-pad-type-preview-text">{typedName}</span>
            </div>
          )}
        </div>
      )}

      <label className="signature-pad-checkbox-label">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>I confirm this is my legal electronic signature and I agree to be bound by this contract</span>
      </label>

      <div className="signature-pad-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {uploading ? 'Uploading...' : isSubmitting ? 'Signing...' : 'Confirm Signature'}
        </button>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => onDecline && onDecline()}
          disabled={isSubmitting || uploading}
        >
          Decline
        </button>
      </div>
    </div>
  );
}

export default SignaturePad;
