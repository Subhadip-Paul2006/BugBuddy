/**
 * BugBuddy — Screen C: Interactive Debugging Chat Workbench
 * Specification: docs/UI_UX.md Screen C & docs/TRD.md Section 9
 * 
 * Provides a Minecraft-inspired multi-turn sprint chat workstation with:
 * - Clear separation of user and ByteBuddy messages
 * - Sarcastic roast block & grounded diagnosis
 * - 7 contextual action chips (Simpler, Deeper, Minimal Diff, Worked Example, More Tests, Line X, Roast)
 * - Code copy buttons, code attachment, edge-case generation, and bug resolution (+50 XP)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CanonicalLanguage,
  ByteBuddyMood,
  ChatSession,
  ChatMessage,
  FollowUpActionType,
} from '../../types';
import { LanguagePixelLogo } from '../common/LanguagePixelLogo';
import { PixelIcon, PixelIconName } from '../common/PixelIcon';
import {
  createInitialChatSession,
  generateActionResponse,
  sendChatMessage,
  FOLLOW_UP_CHIP_LABELS,
} from '../../services/chatService';
import { scanAndRedactSecrets } from '../../utils/secretRedactor';

const CHIP_PIXEL_ICONS: Record<FollowUpActionType, PixelIconName> = {
  simpler: 'paw',
  deeper: 'eye',
  minimal_diff: 'broom',
  worked_example: 'book',
  more_tests: 'scroll',
  explain_line: 'lightning',
  roast_again: 'flame',
};

interface DebugChatProps {
  language?: CanonicalLanguage;
  onSetMood: (mood: ByteBuddyMood) => void;
  onAddXP: (amount: number) => void;
  onReturnToBaseCamp: () => void;
  onNavigateToConfession: () => void;
}

function renderMessageContent(
  content: string,
  messageId: string,
  copyFeedback: string | null,
  onCopy: (code: string, id: string) => void
): React.ReactNode {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex, match.index)}
        </span>
      );
    }

    const codeLang = match[1] || 'code';
    const codeBody = match[2];
    const codeId = `${messageId}-code-${blockIndex++}`;

    parts.push(
      <div
        key={codeId}
        style={{
          margin: '10px 0',
          border: '1px solid var(--bb-border-subtle)',
          backgroundColor: '#0A0C10',
          borderRadius: '2px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            backgroundColor: '#12151D',
            borderBottom: '1px solid var(--bb-border-subtle)',
            fontSize: '10px',
            fontFamily: 'var(--bb-font-code)',
            color: 'var(--bb-color-gold)',
          }}
        >
          <span>{codeLang.toUpperCase()}</span>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={() => onCopy(codeBody, codeId)}
            style={{ fontSize: '8px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {copyFeedback === codeId ? (
              <>
                <PixelIcon name="check" size={8} color="#2ECC71" />
                <span>COPIED!</span>
              </>
            ) : (
              <>
                <PixelIcon name="clipboard" size={8} />
                <span>COPY CODE</span>
              </>
            )}
          </button>
        </div>
        <pre
          style={{
            margin: 0,
            padding: '10px',
            fontFamily: 'var(--bb-font-code)',
            fontSize: '12px',
            color: 'var(--bb-text-code-green)',
            overflowX: 'auto',
            whiteSpace: 'pre',
          }}
        >
          {codeBody}
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>
    );
  }

  return parts.length > 0 ? parts : content;
}

export const DebugChat: React.FC<DebugChatProps> = ({
  language = 'cpp',
  onSetMood,
  onAddXP,
  onReturnToBaseCamp,
  onNavigateToConfession,
}) => {
  // Session State
  const [session, setSession] = useState<ChatSession>(() => createInitialChatSession(language));
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showAttachModal, setShowAttachModal] = useState<boolean>(false);
  const [attachSnippetCode, setAttachSnippetCode] = useState<string>('');
  const [resolvedCelebration, setResolvedCelebration] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isSending]);

  // Copy code utility
  const handleCopy = async (code: string, id: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback(id);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback('Failed to copy');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setValidationError('Cannot send empty message. Describe your bug or paste an error trace!');
      onSetMood('DISAPPOINTED');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (isSending) return;

    setValidationError(null);
    setIsSending(true);
    onSetMood('NEUTRAL');
    setInputText('');

    try {
      const { updatedSession, newMood } = await sendChatMessage(session, trimmed);
      setSession(updatedSession);
      onSetMood(newMood);
    } catch {
      // Fallback on error
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: '[!] Terminal error: Failed to process diagnostic retrieval. Please verify your query and try again.',
        timestamp: now,
      };
      setSession((prev) => ({ ...prev, messages: [...prev.messages, errorMessage] }));
      onSetMood('DRAMATIC_DESPAIR');
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Trigger contextual action chip
  const handleActionChip = (action: FollowUpActionType) => {
    if (isSending) return;

    // Find the last assistant message with a diagnosis
    const lastBotMessage = [...session.messages]
      .reverse()
      .find((m) => m.sender === 'assistant' && m.diagnosisResult);

    const { content: botContent, newMood, isDemo, demoDisclaimer } = generateActionResponse(
      action,
      lastBotMessage?.diagnosisResult,
      session.language
    );

    const chipMeta = FOLLOW_UP_CHIP_LABELS[action];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userPromptMessage: ChatMessage = {
      id: `usr-chip-${Date.now()}`,
      sender: 'user',
      content: `${chipMeta.icon} ${chipMeta.label}`,
      timestamp: now,
      isActionResponse: true,
    };

    const botResponseMessage: ChatMessage = {
      id: `bot-chip-${Date.now()}`,
      sender: 'assistant',
      content: botContent,
      timestamp: now,
      diagnosisResult: lastBotMessage?.diagnosisResult,
      isActionResponse: true,
      isDemo,
      demoDisclaimer,
      suggestedActionChips: [
        'simpler',
        'deeper',
        'minimal_diff',
        'worked_example',
        'more_tests',
        'explain_line',
        'roast_again',
      ],
    };

    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userPromptMessage, botResponseMessage],
    }));

    onSetMood(newMood);
  };

  // Mark Bug Resolved (+50 XP)
  const handleMarkResolved = () => {
    if (session.status === 'Resolved') return;

    onAddXP(50);
    onSetMood('ECSTATIC');
    setResolvedCelebration(true);
    setSession((prev) => ({
      ...prev,
      status: 'Resolved',
      messages: [
        ...prev.messages,
        {
          id: `resolved-${Date.now()}`,
          sender: 'assistant',
          content: '**BUG SLAIN! +50 XP AWARDED!**\n\nByteBuddy did a triumphant backflip! The bug has been banished to the Bug Graveyard. Great job holding your line in the debugging trenches!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    }));
    setTimeout(() => setResolvedCelebration(false), 5000);
  };

  // Clear chat
  const handleClearChat = () => {
    setSession((prev) => ({
      ...prev,
      messages: [],
      status: 'Debugging',
    }));
    onSetMood('NEUTRAL');
  };

  // New Sprint Session
  const handleNewSprint = () => {
    setSession(createInitialChatSession(language));
    onSetMood('HAPPY');
  };

  // Keyboard shortcut Ctrl+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Attach code modal submit
  const handleInsertAttachedCode = () => {
    if (!attachSnippetCode.trim()) return;
    const sanitized = scanAndRedactSecrets(attachSnippetCode);
    setInputText((prev) => (prev ? `${prev}\n\n\`\`\`${session.language}\n${sanitized.redactedCode}\n\`\`\`` : `\`\`\`${session.language}\n${sanitized.redactedCode}\n\`\`\``));
    setAttachSnippetCode('');
    setShowAttachModal(false);
  };

  return (
    <div
      className="bb-chat-workbench"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        maxWidth: '1050px',
        margin: '0 auto',
        padding: '20px 16px',
        minHeight: '82vh',
      }}
      aria-label="Debugging Workbench"
    >
      {/* 1. Header Toolbar */}
      <div
        className="bb-panel-hearth"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <PixelIcon name="chat" size={28} />
          <div>
            <h1
              style={{
                fontFamily: 'var(--bb-font-pixel-display)',
                fontSize: '13px',
                color: 'var(--bb-text-white)',
                margin: 0,
                letterSpacing: '0.5px',
              }}
            >
              DEBUGGING WORKBENCH: MULTI-TURN SPRINT CHAT
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'var(--bb-font-code)',
                  fontSize: '11px',
                  color: 'var(--bb-color-gold)',
                }}
              >
                {session.title}
              </span>
              <span
                className="bb-tag-lang"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  fontSize: '10px',
                }}
              >
                <LanguagePixelLogo language={session.language} size={13} />
                {session.language.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  backgroundColor:
                    session.status === 'Resolved'
                      ? 'rgba(46, 204, 113, 0.2)'
                      : session.status === 'Diagnosed'
                      ? 'rgba(0, 188, 212, 0.2)'
                      : 'rgba(241, 196, 15, 0.2)',
                  color:
                    session.status === 'Resolved'
                      ? 'var(--bb-color-emerald)'
                      : session.status === 'Diagnosed'
                      ? 'var(--bb-color-diamond)'
                      : 'var(--bb-color-gold)',
                  border: `1px solid ${
                    session.status === 'Resolved'
                      ? 'var(--bb-color-emerald)'
                      : session.status === 'Diagnosed'
                      ? 'var(--bb-color-diamond)'
                      : 'var(--bb-color-gold)'
                  }`,
                }}
              >
                {session.status.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--bb-font-pixel-display)',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  backgroundColor: 'rgba(230, 126, 34, 0.15)',
                  color: 'var(--bb-color-copper)',
                  border: '1px solid var(--bb-color-copper)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Chat sessions exist only in memory during the browser session and reset on reload"
              >
                <PixelIcon name="book" size={10} color="var(--bb-color-copper)" />
                <span>IN-MEMORY (RESETS ON RELOAD)</span>
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={handleClearChat}
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Clear current message history"
          >
            <PixelIcon name="trash" size={10} />
            <span>CLEAR CHAT</span>
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-gold"
            onClick={handleNewSprint}
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            title="Start new sprint session"
          >
            <PixelIcon name="plus" size={10} />
            <span>NEW SPRINT</span>
          </button>
          <button
            type="button"
            className="bb-btn bb-btn-stone"
            onClick={onReturnToBaseCamp}
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="tent" size={10} />
            <span>BASE CAMP</span>
          </button>
        </div>
      </div>

      {/* Celebration Banner */}
      {resolvedCelebration && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            backgroundColor: 'rgba(46, 204, 113, 0.15)',
            border: '2px solid var(--bb-color-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PixelIcon name="trophy" size={24} color="var(--bb-color-gold)" />
            <div>
              <div
                style={{
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '10px',
                  color: 'var(--bb-color-emerald)',
                }}
              >
                LEVEL PROGRESSION RECORDED!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--bb-text-primary)' }}>
                You earned <strong>+50 XP</strong> for resolving this debugging sprint!
              </div>
            </div>
          </div>
          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={onNavigateToConfession}
            style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <PixelIcon name="swords" size={10} />
            <span>CONFESS NEXT BUG</span>
          </button>
        </div>
      )}

      {/* 2. Scrollable Message Thread */}
      <div
        className="bb-panel-slab"
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '560px',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #181A22 0%, #101218 100%)',
          border: '2px solid var(--bb-border-subtle)',
        }}
        aria-live="polite"
        role="log"
      >
        {session.messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--bb-text-secondary)' }}>
            <div style={{ marginBottom: '8px' }}>
              <PixelIcon name="chat" size={36} color="var(--bb-text-muted)" />
            </div>
            <div style={{ fontFamily: 'var(--bb-font-pixel-display)', fontSize: '11px', color: 'var(--bb-color-gold)' }}>
              DEBUGGING WORKBENCH READY
            </div>
            <p style={{ fontSize: '13px', maxWidth: '420px', margin: '8px auto 16px' }}>
              Type your bug description, paste compiler errors, or use the action chips to collaborate with ByteBuddy.
            </p>
            <button
              type="button"
              className="bb-btn bb-btn-emerald"
              onClick={handleNewSprint}
              style={{ fontSize: '9px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PixelIcon name="rocket" size={10} />
              <span>LOAD SAMPLE BUG DISCUSSION</span>
            </button>
          </div>
        ) : (
          session.messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            const isLastMessage = index === session.messages.length - 1;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  gap: '6px',
                }}
              >
                {/* Message Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--bb-font-code)',
                    color: isUser ? 'var(--bb-color-diamond)' : 'var(--bb-color-gold)',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {isUser ? (
                      <>
                        <PixelIcon name="pencil" size={12} color="var(--bb-color-diamond)" />
                        <span>USER</span>
                      </>
                    ) : (
                      <>
                        <PixelIcon name="bug" size={12} color="var(--bb-color-gold)" />
                        <span>BYTEBUDDY</span>
                      </>
                    )}
                  </span>
                  <span style={{ color: 'var(--bb-text-muted)', fontSize: '10px' }}>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '14px 18px',
                    borderRadius: '2px',
                    backgroundColor: isUser ? '#232733' : '#1C1924',
                    border: isUser ? '1px solid #3E465A' : '1px solid #3F3057',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                    color: 'var(--bb-text-primary)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                  }}
                >
                  {/* Attribution Badge */}
                  {!isUser && (
                    <div style={{ marginBottom: '10px' }}>
                      {msg.isDemo ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(241, 196, 15, 0.15)',
                            border: '1px solid var(--bb-color-gold)',
                            borderRadius: '2px',
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '10px',
                            color: 'var(--bb-color-gold)',
                          }}
                          title={msg.demoDisclaimer || 'Demonstration response from local adapter'}
                        >
                          <PixelIcon name="lightning" size={10} color="var(--bb-color-gold)" />
                          <span>DEMONSTRATION RESPONSE — Local Interactive Adapter</span>
                        </div>
                      ) : msg.diagnosisResult && !msg.diagnosisResult.isDemo && msg.diagnosisResult.providerId && msg.diagnosisResult.providerId !== 'deterministic-fallback' ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(155, 89, 182, 0.15)',
                            border: '1px solid var(--bb-color-amethyst)',
                            borderRadius: '2px',
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '10px',
                            color: 'var(--bb-color-amethyst)',
                          }}
                        >
                          <PixelIcon name="lightning" size={10} color="var(--bb-color-amethyst)" />
                          <span>AI-ASSISTED GROUNDED DIAGNOSIS ({msg.diagnosisResult.providerId.toUpperCase()}{msg.diagnosisResult.modelId ? ` • ${msg.diagnosisResult.modelId}` : ''})</span>
                        </div>
                      ) : msg.diagnosisResult && !msg.diagnosisResult.isDemo && (msg.diagnosisResult.usedFallback || msg.diagnosisResult.providerId === 'deterministic-fallback') ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(52, 152, 219, 0.15)',
                            border: '1px solid var(--bb-color-lapis)',
                            borderRadius: '2px',
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '10px',
                            color: 'var(--bb-color-lapis)',
                          }}
                        >
                          <PixelIcon name="scroll" size={10} color="var(--bb-color-lapis)" />
                          <span>DETERMINISTIC RETRIEVAL FALLBACK (STAGE 4 ENGINE) — #{msg.diagnosisResult.id}</span>
                        </div>
                      ) : msg.diagnosisResult && !msg.diagnosisResult.isDemo ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(46, 204, 113, 0.15)',
                            border: '1px solid var(--bb-color-emerald)',
                            borderRadius: '2px',
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '10px',
                            color: 'var(--bb-color-emerald)',
                          }}
                        >
                          <PixelIcon name="book" size={10} color="var(--bb-color-emerald)" />
                          <span>CURATED KNOWLEDGE BASE — Grounded Pattern #{msg.diagnosisResult.id}</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(149, 165, 166, 0.15)',
                            border: '1px solid var(--bb-border-subtle)',
                            borderRadius: '2px',
                            fontFamily: 'var(--bb-font-code)',
                            fontSize: '10px',
                            color: 'var(--bb-text-muted)',
                          }}
                        >
                          <PixelIcon name="eye" size={10} color="var(--bb-text-muted)" />
                          <span>UNMATCHED PATTERN — Honest No-Match State</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sarcastic roast quote if present */}
                  {msg.diagnosisResult && (
                    <div
                      style={{
                        padding: '10px 14px',
                        marginBottom: '12px',
                        backgroundColor: '#281F26',
                        borderLeft: '4px solid var(--bb-color-fire-glow)',
                        fontFamily: 'var(--bb-font-pixel-sub)',
                        fontSize: '16px',
                        color: 'var(--bb-text-white)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <PixelIcon name="flame" size={16} className="bb-anim-fire" />
                      <span>"{msg.diagnosisResult.roast}"</span>
                    </div>
                  )}

                  {/* Standard Message Content */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {renderMessageContent(msg.content, msg.id, copyFeedback, handleCopy)}
                  </div>

                  {/* Grounded Code Fix Block if present */}
                  {msg.diagnosisResult && msg.diagnosisResult.fixedCode && (
                    <div style={{ marginTop: '14px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--bb-font-pixel-display)',
                            fontSize: '9px',
                            color: 'var(--bb-color-emerald)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <PixelIcon name="gear" size={11} color="var(--bb-color-emerald)" />
                          <span>RECOMMENDED CODE FIX:</span>
                        </span>
                        <button
                          type="button"
                          className="bb-btn bb-btn-stone"
                          onClick={() => handleCopy(msg.diagnosisResult!.fixedCode, msg.id)}
                          style={{ fontSize: '8px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copyFeedback === msg.id ? (
                            <>
                              <PixelIcon name="check" size={8} color="#2ECC71" />
                              <span>COPIED!</span>
                            </>
                          ) : (
                            <>
                              <PixelIcon name="clipboard" size={8} />
                              <span>COPY FIX</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          padding: '10px',
                          backgroundColor: '#0A0C10',
                          border: '1px solid var(--bb-border-subtle)',
                          fontFamily: 'var(--bb-font-code)',
                          fontSize: '12px',
                          color: 'var(--bb-text-code-green)',
                          overflowX: 'auto',
                        }}
                      >
                        {msg.diagnosisResult.fixedCode}
                      </pre>
                    </div>
                  )}

                  {/* Grounded Documentation Citations */}
                  {msg.diagnosisResult && msg.diagnosisResult.sources && msg.diagnosisResult.sources.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--bb-border-subtle)',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ color: 'var(--bb-text-secondary)', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <PixelIcon name="book" size={10} color="var(--bb-color-diamond)" />
                          <span>Grounded Knowledge Citations & Provenance:</span>
                        </span>
                        {msg.diagnosisResult.responseMode && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontFamily: 'var(--bb-font-code)',
                              color: msg.diagnosisResult.responseMode === 'DIRECT_MATCH' ? 'var(--bb-color-emerald)' : 'var(--bb-color-diamond)',
                            }}
                          >
                            Mode: {msg.diagnosisResult.responseMode}
                          </span>
                        )}
                      </div>
                      {msg.diagnosisResult.sources && msg.diagnosisResult.sources.length > 0 ? (
                        msg.diagnosisResult.sources.map((s, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: 'var(--bb-color-diamond)',
                                textDecoration: 'underline',
                                fontSize: '11px',
                                wordBreak: 'break-all',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{s.title || s.url}</span>
                              <PixelIcon name="arrow-right" size={8} color="var(--bb-text-muted)" />
                            </a>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              {s.recordId && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontFamily: 'var(--bb-font-code)',
                                    padding: '1px 4px',
                                    backgroundColor: '#1E2333',
                                    color: 'var(--bb-color-gold)',
                                    borderRadius: '2px',
                                  }}
                                >
                                  #{s.recordId}
                                </span>
                              )}
                              {s.isPrimary !== undefined && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontFamily: 'var(--bb-font-code)',
                                    padding: '1px 4px',
                                    backgroundColor: s.isPrimary ? 'rgba(46, 204, 113, 0.2)' : 'rgba(0, 188, 212, 0.2)',
                                    color: s.isPrimary ? 'var(--bb-color-emerald)' : 'var(--bb-color-diamond)',
                                    borderRadius: '2px',
                                  }}
                                >
                                  {s.isPrimary ? 'PRIMARY' : 'RELATED'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--bb-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <PixelIcon name="book" size={10} color="var(--bb-text-muted)" />
                          <span>No documentation citations available for this record.</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Limitations and Uncertainty Display */}
                  {msg.diagnosisResult && msg.diagnosisResult.limitations && msg.diagnosisResult.limitations.length > 0 && (
                    <div
                      style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px dashed var(--bb-border-subtle)',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <span style={{ color: 'var(--bb-color-gold)', fontFamily: 'var(--bb-font-pixel-display)', fontSize: '8px' }}>
                        LIMITATIONS & SYSTEM BOUNDARIES:
                      </span>
                      {msg.diagnosisResult.limitations.map((lim, limIdx) => (
                        <div key={limIdx} style={{ fontSize: '10px', color: 'var(--bb-text-muted)', display: 'flex', gap: '6px' }}>
                          <span>•</span>
                          <span>{lim}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 7 Contextual Action Chips (Shown on latest assistant message) */}
                {!isUser && isLastMessage && msg.suggestedActionChips && (
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      maxWidth: '90%',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--bb-font-pixel-display)',
                        fontSize: '9px',
                        color: 'var(--bb-color-gold)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <PixelIcon name="lightning" size={10} color="var(--bb-color-gold)" />
                      <span>CONTEXTUAL FOLLOW-UP ACTIONS:</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}
                    >
                      {msg.suggestedActionChips.map((chipKey) => {
                        const meta = FOLLOW_UP_CHIP_LABELS[chipKey];
                        return (
                          <button
                            key={chipKey}
                            type="button"
                            className="bb-btn bb-btn-stone"
                            onClick={() => handleActionChip(chipKey)}
                            disabled={isSending}
                            title={meta.description}
                            style={{
                              fontSize: '9px',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              backgroundColor: '#262432',
                              border: '1px solid #433857',
                            }}
                          >
                            <PixelIcon name={CHIP_PIXEL_ICONS[chipKey] || 'scroll'} size={12} />
                            <span>{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {isSending && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#1C1924',
              border: '1px solid #3F3057',
              borderRadius: '2px',
              alignSelf: 'flex-start',
              fontFamily: 'var(--bb-font-code)',
              fontSize: '11px',
              color: 'var(--bb-color-gold)',
            }}
            aria-live="polite"
          >
            <PixelIcon name="pickaxe" size={14} color="var(--bb-color-gold)" />
            <span>ByteBuddy is mining diagnostic knowledge...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input & Composer Bar */}
      <div
        className="bb-panel-slab"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#161820',
          border: '2px solid var(--bb-border-subtle)',
        }}
      >
        {validationError && (
          <div
            role="alert"
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              border: '1px solid var(--bb-color-ruby)',
              color: 'var(--bb-color-ruby)',
              fontFamily: 'var(--bb-font-code)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PixelIcon name="cross" size={12} color="var(--bb-color-ruby)" />
            <span>{validationError}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your follow-up inquiry or paste modified code... (Press Ctrl+Enter to send)"
            rows={3}
            style={{
              flex: 1,
              backgroundColor: '#0C0E14',
              border: '1px solid var(--bb-border-subtle)',
              color: 'var(--bb-text-primary)',
              fontFamily: 'var(--bb-font-code)',
              fontSize: '13px',
              padding: '10px 12px',
              resize: 'vertical',
              minHeight: '60px',
            }}
          />
          <button
            type="button"
            className="bb-btn bb-btn-ruby"
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isSending}
            style={{
              fontSize: '11px',
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              minWidth: '100px',
            }}
          >
            <PixelIcon name="swords" size={14} />
            <span>{isSending ? 'ANALYZING...' : 'SEND'}</span>
          </button>
        </div>

        {/* Quick Utilities Hotbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={() => setShowAttachModal(true)}
              style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <PixelIcon name="paperclip" size={10} />
              <span>ATTACH CODE</span>
            </button>
            <button
              type="button"
              className="bb-btn bb-btn-stone"
              onClick={() => handleActionChip('more_tests')}
              style={{ fontSize: '9px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <PixelIcon name="scroll" size={10} />
              <span>GENERATE EDGE CASES</span>
            </button>
          </div>

          <button
            type="button"
            className="bb-btn bb-btn-emerald"
            onClick={handleMarkResolved}
            disabled={session.status === 'Resolved'}
            style={{
              fontSize: '9px',
              padding: '6px 14px',
              boxShadow: session.status === 'Resolved' ? 'none' : '0 0 10px rgba(46, 204, 113, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {session.status === 'Resolved' ? (
              <>
                <PixelIcon name="check" size={10} color="#2ECC71" />
                <span>BUG RESOLVED (+50 XP EARNED)</span>
              </>
            ) : (
              <>
                <PixelIcon name="check" size={10} />
                <span>MARK BUG RESOLVED (+50 XP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Attachment Modal */}
      {showAttachModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="bb-panel-hearth"
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              backgroundColor: '#181A22',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--bb-font-pixel-display)',
                  fontSize: '11px',
                  color: 'var(--bb-color-gold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <PixelIcon name="paperclip" size={12} color="var(--bb-color-gold)" />
                <span>ATTACH CODE SNIPPET ({session.language.toUpperCase()})</span>
              </h3>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={() => setShowAttachModal(false)}
                style={{ fontSize: '9px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <PixelIcon name="cross" size={9} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--bb-text-secondary)' }}>
              Paste code into the terminal buffer. Heuristic secret scanning will automatically scrub API keys and sensitive tokens before inserting.
            </p>

            <textarea
              value={attachSnippetCode}
              onChange={(e) => setAttachSnippetCode(e.target.value)}
              placeholder={`Paste your ${session.language.toUpperCase()} code snippet here...`}
              rows={8}
              style={{
                backgroundColor: '#090B0F',
                border: '1px solid var(--bb-border-subtle)',
                color: 'var(--bb-text-code-green)',
                fontFamily: 'var(--bb-font-code)',
                fontSize: '12px',
                padding: '10px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="bb-btn bb-btn-stone"
                onClick={() => setShowAttachModal(false)}
                style={{ fontSize: '9px', padding: '6px 12px' }}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="bb-btn bb-btn-emerald"
                onClick={handleInsertAttachedCode}
                disabled={!attachSnippetCode.trim()}
                style={{ fontSize: '9px', padding: '6px 14px' }}
              >
                INSERT INTO PROMPT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
