import { useEffect } from 'react';

/**
 * Simple dialog. `actions` is a list of { label, onClick, kind } buttons;
 * a Close button is added when no actions are given. Escape and backdrop click close it.
 */
export default function Modal({ title, children, onClose, actions }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const buttons = actions && actions.length ? actions : [{ label: 'Close', onClick: onClose, kind: 'grey' }];
  return (
    <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ph">{title}</div>
        <div className="pb stack">
          {children}
          <div className="modal-actions">
            {buttons.map((b, i) => (
              <button key={b.label} type="button" className={`btn ${b.kind || ''}`} onClick={b.onClick} disabled={b.disabled} autoFocus={i === buttons.length - 1}>
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
