import React, { useState } from 'react';
import { Download, CheckSquare, Square, X, FileSpreadsheet, FileText } from 'lucide-react';

export interface ColumnOption {
  key: string;
  label: string;
  category?: string;
}

interface ColumnExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  availableColumns: ColumnOption[];
  defaultSelectedKeys?: string[];
  onExport: (format: 'excel' | 'csv' | 'pdf', selectedKeys: string[]) => Promise<void>;
  isExporting: boolean;
}

export const ColumnExportModal: React.FC<ColumnExportModalProps> = ({
  isOpen,
  onClose,
  title,
  availableColumns,
  defaultSelectedKeys,
  onExport,
  isExporting,
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    defaultSelectedKeys || availableColumns.map((c) => c.key)
  );
  const [format, setFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedKeys(availableColumns.map((c) => c.key));
  };

  const deselectAll = () => {
    setSelectedKeys([]);
  };

  const handleDownload = async () => {
    if (selectedKeys.length === 0) return;
    await onExport(format, selectedKeys);
    onClose();
  };

  // Group columns by category if available
  const categories = Array.from(
    new Set(availableColumns.map((c) => c.category || 'General'))
  );

  return (
    <div className="policy-modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="policy-modal-card"
        style={{ maxWidth: '640px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="policy-modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              {title}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Select custom fields and format to export
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="policy-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Format Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px' }}>
              Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${format === 'excel' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px 10px' }}
                onClick={() => setFormat('excel')}
              >
                <FileSpreadsheet size={15} />
                Excel (.xlsx)
              </button>
              <button
                type="button"
                className={`btn ${format === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px 10px' }}
                onClick={() => setFormat('csv')}
              >
                <FileText size={15} />
                CSV (.csv)
              </button>
              <button
                type="button"
                className={`btn ${format === 'pdf' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '8px 10px' }}
                onClick={() => setFormat('pdf')}
              >
                <Download size={15} />
                PDF (.pdf)
              </button>
            </div>
          </div>

          {/* Quick Selection Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid var(--color-border)',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
              Fields ({selectedKeys.length} of {availableColumns.length} selected)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={selectAll}
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              >
                Select All
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={deselectAll}
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Checkbox Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((cat) => (
              <div key={cat}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {cat}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '6px' }}>
                  {availableColumns
                    .filter((c) => (c.category || 'General') === cat)
                    .map((col) => {
                      const isChecked = selectedKeys.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.82rem',
                            color: isChecked ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                            background: isChecked ? 'rgba(37, 99, 235, 0.06)' : 'transparent',
                            padding: '6px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: `1px solid ${isChecked ? 'rgba(37, 99, 235, 0.25)' : 'var(--color-border)'}`,
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(col.key)}
                            style={{ display: 'none' }}
                          />
                          {isChecked ? (
                            <CheckSquare size={16} color="#2563EB" />
                          ) : (
                            <Square size={16} color="var(--color-text-muted)" />
                          )}
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="policy-modal-footer" style={{ gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={isExporting || selectedKeys.length === 0}
          >
            <Download size={14} />
            {isExporting ? 'Exporting...' : `Export ${selectedKeys.length} Columns`}
          </button>
        </div>
      </div>
    </div>
  );
};

