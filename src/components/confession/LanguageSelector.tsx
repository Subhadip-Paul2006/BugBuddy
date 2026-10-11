import React from 'react';
import { CanonicalLanguage } from '../../types';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { playEquipSound } from '../../utils/audioSystem';

interface LanguageOption {
  id: CanonicalLanguage;
  name: string;
  extension: string;
  description: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'python', name: 'Python', extension: '.py', description: 'Serpent Script' },
  { id: 'javascript', name: 'JavaScript', extension: '.js', description: 'Dynamic Web' },
  { id: 'typescript', name: 'TypeScript', extension: '.ts', description: 'Strict Typed' },
  { id: 'c', name: 'C', extension: '.c', description: 'System Voxel' },
  { id: 'cpp', name: 'C++', extension: '.cpp', description: 'Object Voxel' },
  { id: 'java', name: 'Java', extension: '.java', description: 'Virtual Brew' },
];

interface LanguageSelectorProps {
  selectedLanguage: CanonicalLanguage;
  onSelectLanguage: (lang: CanonicalLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
}) => {
  return (
    <div className="bb-lang-selector-group" role="radiogroup" aria-label="Select Programming Language Weapon">
      {/* Header Label Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--bb-font-pixel-display)',
              fontSize: '9px',
              color: 'var(--bb-text-gold)',
              letterSpacing: '0.5px',
            }}
          >
            SELECT WEAPON / LANGUAGE ({LANGUAGE_OPTIONS.length} SUPPORTED)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--bb-font-code)',
              fontSize: '11px',
              color: 'var(--bb-text-secondary)',
            }}
          >
            Equipped:
          </span>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              backgroundColor: 'var(--bb-surface-inset)',
              border: '1px solid var(--bb-color-emerald)',
              boxShadow: '0 0 6px var(--bb-color-emerald-glow)',
            }}
          >
            <LanguagePixelLogo language={selectedLanguage} size={14} />
            <strong
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '9px',
                color: 'var(--bb-color-emerald)',
                letterSpacing: '0.5px',
              }}
            >
              {selectedLanguage.toUpperCase()}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid of 6 Handcrafted Pixel-Art Voxel Slots */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '10px',
        }}
      >
        {LANGUAGE_OPTIONS.map((lang) => {
          const isSelected = selectedLanguage === lang.id;

          return (
            <button
              key={lang.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${lang.name} (${lang.extension})`}
              disabled={disabled}
              onClick={() => {
                playEquipSound();
                onSelectLanguage(lang.id);
              }}
              className={`bb-inventory-slot ${isSelected ? 'active' : ''}`}
              style={{
                width: '100%',
                height: '52px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '10px',
                background: isSelected
                  ? 'linear-gradient(180deg, #242F26 0%, #19221C 100%)'
                  : 'var(--bb-surface-inset)',
                borderColor: isSelected ? 'var(--bb-color-emerald)' : 'var(--bb-border-subtle)',
                boxShadow: isSelected
                  ? 'inset 2px 2px 0px 0px rgba(46,204,113,0.3), inset -2px -2px 0px 0px rgba(0,0,0,0.6), 0 0 10px var(--bb-color-emerald-glow)'
                  : 'inset 2px 2px 0px 0px var(--bb-border-bevel-dark), inset -2px -2px 0px 0px var(--bb-border-bevel-light)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Original Pixel-Art Emblem */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  backgroundColor: isSelected ? 'rgba(0,0,0,0.3)' : 'transparent',
                  border: isSelected ? '1px solid rgba(46,204,113,0.4)' : 'none',
                  flexShrink: 0,
                  transition: 'transform 80ms steps(2)',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <LanguagePixelLogo
                  language={lang.id}
                  size={22}
                  style={{
                    filter: isSelected
                      ? 'drop-shadow(0 0 4px var(--bb-color-emerald-glow))'
                      : 'none',
                  }}
                />
              </div>

              {/* Language Name and Extension */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'left',
                  lineHeight: 1.15,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--bb-font-pixel-display)',
                    fontSize: '9px',
                    color: isSelected ? 'var(--bb-color-emerald)' : 'var(--bb-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '0.4px',
                  }}
                >
                  {lang.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--bb-font-code)',
                    fontSize: '10px',
                    color: isSelected ? 'var(--bb-color-gold)' : 'var(--bb-text-muted)',
                  }}
                >
                  {lang.extension}
                </span>
              </div>

              {/* Equipped Indicator Tab */}
              {isSelected && (
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'var(--bb-color-emerald)',
                    boxShadow: '0 0 4px var(--bb-color-emerald)',
                  }}
                  title="Equipped"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
