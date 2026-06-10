import Button from './Button';

const Modal = ({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = '确认',
  cancelText = '取消',
  confirmDisabled = false,
  confirmClassName = '',
  confirmVariant = 'danger',
}) => {
  if (!open) {
    return null;
  }

  const showActions = cancelText || confirmText;

  return (
    <div className="pm-modal-mask" role="presentation">
      <div className="pm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pm-modal-head">
          <h3 className="pm-modal-title">{title}</h3>
          <button className="pm-modal-close" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="pm-modal-body">{children}</div>
        {showActions ? (
          <div className="pm-modal-actions">
            {cancelText ? <Button type="button" variant="ghost" onClick={onClose}>{cancelText}</Button> : null}
            {confirmText ? (
              <Button type="button" variant={confirmVariant} className={confirmClassName} disabled={confirmDisabled} onClick={onConfirm}>
                {confirmText}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Modal;
