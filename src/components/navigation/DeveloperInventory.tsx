import React from 'react';
import { NavigationTab } from '../../types';
import { playClickSound } from '../../utils/audioSystem';
import { PixelIcon, PixelIconName } from '../common/PixelIcon';

interface DeveloperInventoryProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: PixelIconName;
  badge?: string;
}

export const DeveloperInventory: React.FC<DeveloperInventoryProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems: NavItem[] = [
    { id: 'base-camp', label: 'Base Camp', icon: 'tent' },
    { id: 'confession', label: 'Confession Booth', icon: 'swords', badge: 'NEW' },
    { id: 'chat', label: 'Debugging Chat', icon: 'chat' },
    { id: 'quests', label: 'Quest Board', icon: 'scroll', badge: '3' },
    { id: 'habitat', label: 'Pet Sanctuary', icon: 'paw' },
    { id: 'graveyard', label: 'Bug Graveyard', icon: 'tombstone' },
    { id: 'codex', label: 'Knowledge Codex', icon: 'book' },
    { id: 'settings', label: 'Base Settings', icon: 'gear' },
  ];

  return (
    <aside
      className="bb-developer-inventory"
      style={{
        width: isCollapsed ? 'var(--bb-sidebar-collapsed-width)' : 'var(--bb-sidebar-width)',
        background: 'var(--bb-surface-base)',
        borderRight: '2px solid var(--bb-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 8px',
        transition: 'width 150ms ease-in-out',
        flexShrink: 0,
      }}
      aria-label="Developer Inventory Navigation"
    >
      <div>
        {/* Inventory Header */}
        <div
          style={{
            fontFamily: 'var(--bb-font-pixel-display)',
            fontSize: '9px',
            color: 'var(--bb-text-muted)',
            padding: '8px 10px 12px 10px',
            borderBottom: '1px solid var(--bb-border-subtle)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            letterSpacing: '0.5px',
          }}
        >
          {isCollapsed ? (
            <PixelIcon name="inventory" size={16} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PixelIcon name="inventory" size={15} />
                <span>INVENTORY</span>
              </div>
              <span style={{ fontSize: '8px', color: 'var(--bb-color-gold)' }}>8/8 SLOTS</span>
            </>
          )}
        </div>

        {/* Navigation Hotbar Slot Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  playClickSound();
                  onSelectTab(item.id);
                }}
                className={`bb-nav-item ${isActive ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: isCollapsed ? '10px 0' : '9px 12px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  background: isActive ? 'var(--bb-surface-panel)' : 'transparent',
                  border: isActive
                    ? '2px solid var(--bb-color-emerald)'
                    : '2px solid transparent',
                  boxShadow: isActive
                    ? 'inset 2px 2px 0px rgba(0,0,0,0.5), 0 0 6px var(--bb-color-emerald-glow)'
                    : 'none',
                  color: isActive ? 'var(--bb-text-primary)' : 'var(--bb-text-secondary)',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 60ms linear',
                  position: 'relative',
                  textAlign: 'left',
                }}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Pixel Icon in Inset Slot Box */}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                  }}
                >
                  <PixelIcon name={item.icon} size={16} />
                </span>

                {/* Text Label (shown when expanded) */}
                {!isCollapsed && (
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-body)',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#FFFFFF' : 'var(--bb-text-secondary)',
                      flexGrow: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {/* Badge or Indicator */}
                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontFamily: 'var(--bb-font-pixel-display)',
                      fontSize: '7px',
                      padding: '2px 5px',
                      background: item.badge === 'NEW' ? 'var(--bb-color-emerald)' : 'var(--bb-surface-inset)',
                      color: item.badge === 'NEW' ? '#0A2E16' : 'var(--bb-color-gold)',
                      border: '1px solid var(--bb-border-subtle)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active Emerald Pointer */}
                {isActive && !isCollapsed && (
                  <span style={{ color: 'var(--bb-color-emerald)', display: 'inline-flex' }}>
                    <PixelIcon name="arrow-right" size={8} />
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Collapse Hotbar Button */}
      <button
        onClick={() => {
          playClickSound();
          onToggleCollapse();
        }}
        className="bb-btn bb-btn-stone"
        style={{
          width: '100%',
          padding: '8px 6px',
          fontSize: '8px',
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Icons'}
        aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? (
          <PixelIcon name="arrow-right" size={9} />
        ) : (
          <>
            <PixelIcon name="arrow-left" size={9} />
            <span>COLLAPSE</span>
          </>
        )}
      </button>
    </aside>
  );
};
