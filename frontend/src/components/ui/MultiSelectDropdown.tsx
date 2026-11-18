import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Props {
  label: string;
  icon?: React.ReactNode;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<Props> = ({
  label,
  icon,
  options,
  selected,
  onChange,
  placeholder = 'All',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selected.length === 0) return `${placeholder} (${options.length})`;
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '5px',
        }}
      >
        {icon}
        {label}
        {selected.length > 0 && (
          <span
            className="badge badge-primary font-mono"
            style={{ fontSize: '10px', padding: '1px 5px', marginLeft: 'auto' }}
          >
            {selected.length}
          </span>
        )}
      </label>

      {/* Select Box Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 12px',
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          border: `1px solid ${selected.length > 0 ? 'var(--color-primary-light, #2455b5)' : 'var(--color-border, #cbd5e1)'}`,
          borderRadius: 'var(--radius-md)',
          color: selected.length > 0 ? 'var(--color-text-primary, #0f172a)' : 'var(--color-text-secondary, #334155)',
          fontSize: '12px',
          cursor: 'pointer',
          textAlign: 'left',
          minHeight: '34px',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: selected.length > 0 ? 600 : 400,
          }}
        >
          {getDisplayText()}
        </span>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            marginLeft: '6px',
            color: 'var(--color-text-muted)',
          }}
        />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            minWidth: '260px',
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border, #cbd5e1)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Quick Search */}
          {options.length > 5 && (
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={12}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%',
                  padding: '5px 8px 5px 26px',
                  fontSize: '11px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  backgroundColor: 'var(--color-bg-alt, #f8fafc)',
                  color: 'var(--color-text-primary, #0f172a)',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
            </div>
          )}

          {/* Quick Actions (Select All / Clear) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 4px',
              borderBottom: '1px solid var(--color-border)',
              paddingBottom: '4px',
            }}
          >
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-light, #2455b5)',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 4px',
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={selected.length === 0}
              style={{
                background: 'none',
                border: 'none',
                color: selected.length > 0 ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                fontSize: '11px',
                cursor: selected.length > 0 ? 'pointer' : 'default',
                padding: '2px 4px',
              }}
            >
              Clear
            </button>
          </div>

          {/* Options List */}
          <div
            style={{
              maxHeight: '190px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              backgroundColor: 'var(--color-bg-card, #ffffff)',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '10px',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                }}
              >
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(0, 114, 206, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-primary)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={opt}
                    >
                      {opt}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
