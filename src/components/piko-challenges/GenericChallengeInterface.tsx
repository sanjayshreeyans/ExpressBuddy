/**
 * Generic Challenge Interface
 * Dynamic component that loads ANY challenge from the manifest by ID
 * Eliminates the need to create separate components for each challenge
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import cn from "classnames";
import ControlTray from "../control-tray/ControlTray";
import { VideoExpressBuddyAvatar } from "../avatar/VideoExpressBuddyAvatar";
import Captions from "../captions/Captions";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useResponseBuffer } from "../../hooks/useResponseBuffer";
import { AvatarState } from "../../types/avatar";
import { ChallengeIntroCard } from "./ChallengeIntroCard";
import { ChallengeChecklist } from "./ChallengeChecklist";
import { ChallengeSuccessDialog } from "./ChallengeSuccessDialog";
import challengeManifestService, { Challenge, ChallengeTodo } from "../../services/challenge-manifest-service";
import "../main-interface/main-interface.scss";
import "../../styles/hint-animations.css";
import {
  Modality,
  FunctionDeclaration,
  Tool,
  Type,
} from "@google/genai";

// Define async behavior constants
const AsyncBehavior = {
  NON_BLOCKING: "NON_BLOCKING"
};

const AsyncScheduling = {
  INTERRUPT: "INTERRUPT",
  WHEN_IDLE: "WHEN_IDLE",
  SILENT: "SILENT"
};

// Extended FunctionDeclaration type to include behavior
type ExtendedFunctionDeclaration = FunctionDeclaration & {
  behavior?: string;
};

interface GenericChallengeInterfaceProps {
  challengeId?: string; // Can be passed as prop or from URL params
}

export default function GenericChallengeInterface({ challengeId: propChallengeId }: GenericChallengeInterfaceProps) {
  const { challengeId: paramChallengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const {
    connected,
    client,
    setConfig,
    config,
    volume,
    hintSystem,
    isHintIndicatorVisible,
    sendHintToGemini,
    setEnableChunking,
    onAITurnComplete,
    onAITurnStart
  } = useLiveAPIContext();
  
  const { log } = useLoggerStore();

  const [avatarState, setAvatarState] = useState<AvatarState>({
    status: 'idle',
    isBuffering: false,
    hasGeneratedContent: false
  });
  const [currentAvatarSubtitle, setCurrentAvatarSubtitle] = useState<string>('');
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState<boolean>(false);
  
  // Challenge state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [todos, setTodos] = useState<ChallengeTodo[]>([]);
  const [showIntroCard, setShowIntroCard] = useState<boolean>(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [challengeStarted, setChallengeStarted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { buffer, addChunk, markComplete, reset } = useResponseBuffer();

  const languageCode = (config as any)?.speechConfig?.language_code || 'en-US';

  // Determine which challenge ID to use
  const activeChallenge = propChallengeId || paramChallengeId;

  // Load challenge on mount
  useEffect(() => {
    const initializeChallenge = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!activeChallenge) {
          setError('No challenge ID provided');
          return;
        }

        // Load challenge from manifest
        const loadedChallenge = await challengeManifestService.getChallengeById(activeChallenge);
        
        if (!loadedChallenge) {
          setError(`Challenge not found: ${activeChallenge}`);
          return;
        }

        setChallenge(loadedChallenge);
        setBackgroundImage(challengeManifestService.getBackgroundImage());
        setTodos(challengeManifestService.get_todo_status());

        console.log('🎯 Challenge initialized:', {
          id: loadedChallenge.id,
          title: loadedChallenge.title,
          todos: loadedChallenge.todos.length
        });
      } catch (err) {
        console.error('❌ Error loading challenge:', err);
        setError('Failed to load challenge');
      } finally {
        setLoading(false);
      }
    };

    initializeChallenge();
  }, [activeChallenge]);

  // Register avatar animation callbacks
  useEffect(() => {
    onAITurnStart(() => {
      console.log('🎬 AI Turn Started - TALKING');
      setIsAvatarSpeaking(true);
      setAvatarState(prev => ({
        ...prev,
        status: 'speaking'
      }));
    });

    onAITurnComplete(() => {
      console.log('✋ AI Turn Complete - LISTENING');
      setIsAvatarSpeaking(false);
      setAvatarState(prev => ({
        ...prev,
        status: 'idle'
      }));
    });
  }, [onAITurnStart, onAITurnComplete]);

  // Monitor todos for completion
  useEffect(() => {
    const handleTodoUpdate = (event: Event) => {
      const { allTodos, allComplete } = (event as CustomEvent).detail;
      setTodos(allTodos);
      
      if (allComplete) {
        console.log('🎉 All objectives complete!');
        setTimeout(() => setShowSuccessDialog(true), 1500);
      }
    };

    window.addEventListener('challenge-todo-updated', handleTodoUpdate);
    return () => window.removeEventListener('challenge-todo-updated', handleTodoUpdate);
  }, []);

  // Define challenge tools (NON_BLOCKING)
  const defineChallengeTools = useCallback(() => {
    const challengeFunctions: ExtendedFunctionDeclaration[] = [
      {
        name: "get_todo_status",
        description: "Get current status of all learning objectives",
        parameters: {
          type: Type.OBJECT,
          properties: {},
          required: []
        },
        behavior: AsyncBehavior.NON_BLOCKING
      } as ExtendedFunctionDeclaration,
      {
        name: "mark_todo_complete",
        description: "Mark an objective as complete when the child teaches it",
        parameters: {
          type: Type.OBJECT,
          properties: {
            todoId: {
              type: Type.INTEGER,
              description: `Todo ID (1-${todos.length})`
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: "Whether the objective was learned correctly (usually true to be forgiving)"
            }
          },
          required: ["todoId", "isCorrect"]
        },
        behavior: AsyncBehavior.NON_BLOCKING
      } as ExtendedFunctionDeclaration
    ];

    return {
      tools: [{ functionDeclarations: challengeFunctions }]
    };
  }, [todos.length]);

  // Setup tools when connected and challenge is loaded
  useEffect(() => {
    if (!connected || !challenge) return;

    console.log('⚙️ Setting up challenge tools...');
    const toolsConfig = defineChallengeTools();
    setConfig({
      ...config,
      tools: toolsConfig.tools
    });
  }, [connected, challenge, setConfig, defineChallengeTools, config]);

  // Handle tool calls
  useEffect(() => {
    if (!connected || !client) return;

    const handleToolCall = (toolCall: any) => {
      console.log('🔧 Tool call received:', toolCall);

      const functionResponses = toolCall.functionCalls.map((fc: any) => {
        let result;

        if (fc.name === 'mark_todo_complete') {
          const response = challengeManifestService.mark_todo_complete(fc.args.todoId, fc.args.isCorrect);
          const updatedTodos = challengeManifestService.get_todo_status();
          setTodos(updatedTodos);
          result = { ...response, async_operation: true };
        } else if (fc.name === 'get_todo_status') {
          const status = challengeManifestService.get_todo_status();
          result = {
            success: true,
            todos: status,
            completedCount: status.filter(t => t.complete).length,
            totalCount: status.length,
            async_operation: true
          };
        }

        return {
          id: fc.id,
          name: fc.name,
          response: {
            result,
            scheduling: AsyncScheduling.SILENT
          }
        };
      });

      client.sendToolResponse({ functionResponses });
    };

    client.on('toolcall', handleToolCall);

    return () => {
      client.off('toolcall', handleToolCall);
    };
  }, [connected, client]);

  // Handle streaming
  useEffect(() => {
    if (!connected || !client) return;

    const handleServerContent = (event: any) => {
      console.log('📨 Server content:', event);

      if (event.serverContent?.turnComplete) {
        console.log('✋ Turn complete');
      }
    };

    const handleContentChunk = (event: any) => {
      if (event.contentChunk?.modalities?.includes(Modality.TEXT)) {
        if (event.contentChunk?.text) {
          console.log('📝 Text chunk:', event.contentChunk.text);
        }
      }
    };

    client.on('content', handleContentChunk);

    return () => {
      client.off('content', handleContentChunk);
    };
  }, [connected, client, markComplete]);

  const handleStartChallenge = () => {
    console.log('🚀 Starting challenge...');
    setShowIntroCard(false);
    setChallengeStarted(true);

    if (!connected) {
      console.warn('⚠️ Not connected to Gemini Live API');
    }
  };

  const handleContinue = () => {
    console.log('➡️ Continuing to next challenge...');
    // Can navigate to next challenge or home
    navigate('/piko-challenges');
  };

  const handleRestart = () => {
    console.log('🔄 Restarting challenge...');
    challengeManifestService.reset_todos();
    setTodos(challengeManifestService.get_todo_status());
    setShowSuccessDialog(false);
    setShowIntroCard(true);
    setChallengeStarted(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="avatar-interface" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🐼</div>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading challenge...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !challenge) {
    return (
      <div className="avatar-interface" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1.2rem', color: '#c00' }}>
            {error || 'Challenge not found'}
          </div>
          <button
            onClick={() => navigate('/piko-challenges')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('avatar-interface', {
      'video-bg-mode': backgroundImage && backgroundImage !== ''
    })} style={{
      backgroundImage: backgroundImage && backgroundImage !== '' ? `url(${backgroundImage})` : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {showIntroCard && (
        <ChallengeIntroCard
          onStart={handleStartChallenge}
          onLearnMore={() => console.log('Learn more about:', challenge.title)}
        />
      )}

      {challengeStarted && (
        <>
          <div className="header-section">
            <div className="app-title">
              <h1>{challenge.title}</h1>
              <p>Help Piko learn!</p>
            </div>
            <button
              onClick={() => navigate('/piko-challenges')}
              style={{
                background: '#16a34a',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Exit Challenge
            </button>
          </div>

          <div className="main-content-area">
            <div className="panda-stage">
              <VideoExpressBuddyAvatar
                className="panda-container"
                onAvatarStateChange={(state: AvatarState) => setAvatarState(state)}
                onCurrentSubtitleChange={(text: string) => setCurrentAvatarSubtitle(text)}
              />

              <Captions subtitleText={currentAvatarSubtitle} />

              <div className="panda-status">
                {avatarState.status === 'listening' && (
                  <div className="status-bubble listening">● Listening</div>
                )}
                {avatarState.status === 'processing' && (
                  <div className="status-bubble thinking">● Processing</div>
                )}
                {avatarState.isBuffering && (
                  <div className="status-bubble buffering">● Preparing</div>
                )}
              </div>
            </div>
          </div>

          <ChallengeChecklist
            todos={todos as any}
          />

          <div className="footer-section">
            <ControlTray videoRef={videoRef} supportsVideo={true} />
          </div>
        </>
      )}

      {showSuccessDialog && (
        <ChallengeSuccessDialog
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
