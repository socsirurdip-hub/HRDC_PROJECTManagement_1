import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertOctagon, CheckCircle, Info, X } from 'lucide-react';

export type ModalVariant = 'warning' | 'danger' | 'info' | 'success';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  subtitle?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ModalVariant;
  isLoading?: boolean;
  requiresCheckbox?: boolean;
  checkboxLabel?: string;
  maxWidth?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  message,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  isLoading = false,
  requiresCheckbox = false,
  checkboxLabel = 'I have verified and confirm this action.',
  maxWidth = '500px',
}) => {
  const [isChecked, setIsChecked] = useState(false);

  // Reset checkbox state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    warning: {
      accentColor: 'var(--color-warning, #F39C12)',
      bgLight: 'rgba(243, 156, 18, 0.1)',
      borderLight: 'rgba(243, 156, 18, 0.3)',
      Icon: AlertTriangle,
      btnClass: 'btn-warning',
      defaultBtnBg: '#F39C12',
    },
    danger: {
      accentColor: 'var(--color-danger, #E74C3C)',
      bgLight: 'rgba(231, 76, 60, 0.1)',
      borderLight: 'rgba(231, 76, 60, 0.3)',
      Icon: AlertOctagon,
      btnClass: 'btn-danger',
      defaultBtnBg: '#E74C3C',
    },
    info: {
      accentColor: 'var(--color-info, #2980B9)',
      bgLight: 'rgba(41, 128, 185, 0.1)',
      borderLight: 'rgba(41, 128, 185, 0.3)',
      Icon: Info,
      btnClass: 'btn-primary',
      defaultBtnBg: '#2455B5',
    },
    success: {
      accentColor: 'var(--color-success, #27AE60)',
      bgLight: 'rgba(39, 174, 96, 0.1)',
      borderLight: 'rgba(39, 174, 96, 0.3)',
      Icon: CheckCircle,
      btnClass: 'btn-success',
      defaultBtnBg: '#27AE60',
    },
  }[variant];

  const { Icon, accentColor, bgLight, borderLight } = variantStyles;

  const handleConfirmClick = async () => {
    if (requiresCheckbox && !isChecked) return;
    await onConfirm();
  };

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={!isLoading ? onClose : undefined}
      style={{ zIndex: 999999 }}
    >
      <div
        className="modal"
        style={{
          maxWidth,
          width: '92%',
          border: `1px solid ${borderLight}`,
          boxShadow: `0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px ${borderLight}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with variant accent icon */}
        <div
          className="modal-header"
          style={{
            borderBottom: `1px solid var(--color-border)`,
            background: bgLight,
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: bgLight,
                border: `1px solid ${borderLight}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </h3>
              {subtitle && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {message && (
            <div style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
              {message}
            </div>
          )}

          {children}

          {/* Optional Mandatory Acknowledgement Checkbox */}
          {requiresCheckbox && (
            <div
              style={{
                background: bgLight,
                border: `1px solid ${borderLight}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  color: 'var(--color-text-primary)',
                  lineHeight: '1.5',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  disabled={isLoading}
                  style={{ marginTop: '2px', accentColor }}
                />
                <span>{checkboxLabel}</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{
              background: requiresCheckbox && !isChecked ? 'var(--color-bg-card)' : accentColor,
              color: '#ffffff',
              borderColor: requiresCheckbox && !isChecked ? 'var(--color-border)' : accentColor,
              fontWeight: 600,
              minWidth: '100px',
              cursor: requiresCheckbox && !isChecked ? 'not-allowed' : 'pointer',
              opacity: requiresCheckbox && !isChecked ? 0.6 : 1,
            }}
            onClick={handleConfirmClick}
            disabled={isLoading || (requiresCheckbox && !isChecked)}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
