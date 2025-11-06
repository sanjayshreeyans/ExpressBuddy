/**
 * Piko Challenge Interface - Level 1: Ordering Food at a Restaurant
 * Interactive challenge where children teach Piko social skills
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import challengeTodoService, { ChallengeTodo } from "../../services/challenge-todo-service";
import challengeManifestService, { Challenge } from "../../services/challenge-manifest-service";
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

export default function PikoChallengeInterface() {
  const navigate = useNavigate();
  const { id: challengeId } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // Challenge loading state
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [challengeLoading, setChallengeLoading] = useState<boolean>(true);
  const [challengeError, setChallengeError] = useState<string | null>(null);

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
  const [backgroundVideo, setBackgroundVideo] = useState<string>('/Backgrounds/restaurant/bamboo.jpeg');

  // Challenge-specific state
  const [showIntroCard, setShowIntroCard] = useState<boolean>(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState<boolean>(false);
  const [todos, setTodos] = useState<ChallengeTodo[]>(challengeTodoService.get_todo_status());
  const [challengeStarted, setChallengeStarted] = useState<boolean>(false);

  const { buffer, addChunk, markComplete, reset } = useResponseBuffer();

  const languageCode = (config as any)?.speechConfig?.language_code || 'en-US';

  // Language instruction mapping
  const getLanguageInstruction = (langCode: string): string => {
    const languageMap: { [key: string]: string } = {
      'en-US': 'Respond in English (United States).',
      'en-GB': 'Respond in English (United Kingdom).',
      'es-US': 'Responde en español (Estados Unidos).',
      'es-ES': 'Responde en español (España).',
      'fr-FR': 'Répondez en français (France).',
      'hi-IN': 'हिन्दी में जवाब दें।',
    };
    return languageMap[langCode] || 'Respond in English.';
  };

  // Load challenge from manifest based on URL param
  useEffect(() => {
    const loadChallenge = async () => {
      try {
        setChallengeLoading(true);
        setChallengeError(null);

        // Map legacy route to new ID
        let actualId = challengeId;
        if (actualId === 'restaurant-ordering-level1') {
          actualId = 'restaurant-ordering';
        }

        const loadedChallenge = await challengeManifestService.getChallengeById(actualId || '');
        
        if (!loadedChallenge) {
          setChallengeError(`Challenge "${actualId}" not found`);
          return;
        }

  setChallenge(loadedChallenge);
  setBackgroundVideo(loadedChallenge.backgroundImage || '/Backgrounds/restaurant/bamboo.jpeg');
  challengeTodoService.reset_todos();
  setTodos(challengeTodoService.get_todo_status());
  setShowIntroCard(true);
  setChallengeStarted(false);
  setShowSuccessDialog(false);
  console.log('✅ Challenge loaded:', loadedChallenge.title);
      } catch (error) {
        console.error('❌ Error loading challenge:', error);
        setChallengeError(error instanceof Error ? error.message : 'Failed to load challenge');
      } finally {
        setChallengeLoading(false);
      }
    };

    loadChallenge();
  }, [challengeId]);

  // Update local todo state whenever the manifest todos change
  useEffect(() => {
    if (challenge) {
      setTodos(challengeTodoService.get_todo_status());
    }
  }, [challenge]);

  // Register avatar animation callbacks
  useEffect(() => {
    onAITurnStart(() => {
      console.log('🎬 AI Turn Started - TALKING');
      setIsAvatarSpeaking(true);
    });

    onAITurnComplete(() => {
      console.log('🎬 AI Turn Complete - IDLE');
      setIsAvatarSpeaking(false);
    });
  }, [onAITurnStart, onAITurnComplete]);


  // Set FLASH mode (disable chunking)
  useEffect(() => {
    if (setEnableChunking) {
      setEnableChunking(false);
      console.log('🎬 Video avatar: FLASH mode enabled');
    }
  }, [setEnableChunking]);

  // System prompt for Piko Challenge - Dynamic based on loaded challenge
  useEffect(() => {
    if (!challengeStarted || !challenge) return; // Don't set prompt until challenge starts and is loaded

    // Define challenge tool functions (NON_BLOCKING like memory functions)
    const challengeFunctions: ExtendedFunctionDeclaration[] = [
      {
        name: "get_todo_status",
        description: `Get the current status of all ${challenge.todos.length} learning objectives you need to accomplish. Call this at the start to see what the child needs to teach you.`,
        parameters: {
          type: Type.OBJECT,
          properties: {}
        },
        behavior: AsyncBehavior.NON_BLOCKING
      },
      {
        name: "mark_todo_complete",
        description: `Mark a learning objective as complete when the child teaches you that concept. Be generous - if the child gives reasonable advice related to a todo, mark it complete! todoId 1-${challenge.todos.length}: ${challenge.todos.map(t => `${t.id}=${t.text}`).join(', ')}`,
        parameters: {
          type: Type.OBJECT,
          properties: {
            todoId: {
              type: Type.INTEGER,
              description: `The ID of the todo to mark complete (1-${challenge.todos.length})`
            },
            isCorrect: {
              type: Type.BOOLEAN,
              description: "Whether the child's teaching was correct (be generous, usually true)"
            }
          },
          required: ["todoId", "isCorrect"]
        },
        behavior: AsyncBehavior.NON_BLOCKING
      }
    ];

    const challengeTool: Tool = {
      functionDeclarations: challengeFunctions as FunctionDeclaration[]
    };

    const currentLanguage = languageCode;
    const languageInstruction = getLanguageInstruction(currentLanguage);

    // Piko Challenge System Prompt - Use the challenge's systemPrompt from manifest
    const systemPrompt = `
# LANGUAGE INSTRUCTION
${languageInstruction}
YOU MUST respond in the language specified above.

${challenge.systemPrompt}
`;

    if (setConfig) {
      setConfig((previousConfig: any) => {
        const prevConfig = previousConfig || {};
        const previousSystemText = prevConfig.systemInstruction?.parts?.map((part: any) => part.text).join('\n') || '';

        if (previousSystemText === systemPrompt) {
          return prevConfig;
        }

        const nextConfig = {
          ...prevConfig,
          responseModalities: [Modality.AUDIO],
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          tools: [challengeTool],
          inputAudioTranscription: prevConfig.inputAudioTranscription || {},
          outputAudioTranscription: prevConfig.outputAudioTranscription || {},
        };

        console.log('🎯 Piko Challenge system prompt configured:', {
          language: currentLanguage,
          challenge: challenge.title,
          toolCount: challengeFunctions.length
        });

        return nextConfig;
      });
    }
  }, [languageCode, setConfig, challengeStarted, challenge]);

  // Set video stream
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Handle streaming logs
  useEffect(() => {
    const handleLog = (streamingLog: any) => {
      log(streamingLog);

      if (streamingLog.type === 'server.content' && streamingLog.message?.serverContent) {
        const serverContent = streamingLog.message.serverContent as any;

        if (serverContent.modelTurn?.parts) {
          reset();
          const parts = serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.text && part.text.trim()) {
              addChunk(part.text);
            }
          }
        }
      }

      if (streamingLog.type === 'server.turn.complete' || streamingLog.type === 'turncomplete') {
        markComplete();
      }

      if (streamingLog.type === 'server.turn.start' || streamingLog.type === 'turnstart') {
        reset();
      }
    };

    if (client) {
      client.on('log', handleLog);
      return () => {
        client.off('log', handleLog);
      };
    }
  }, [client, log, addChunk, markComplete, reset]);

  // Tool call handler for challenge functions
  useEffect(() => {
    const handleToolCall = (toolCall: any) => {
      console.log('🎯 Challenge tool call received:', toolCall);

      if (!toolCall.functionCalls) {
        console.warn('⚠️ No function calls in tool call');
        return;
      }

      const functionResponses = toolCall.functionCalls.map((fc: any) => {
        console.log(`🎯 Processing challenge function: ${fc.name}`, fc.args);

        let result;

        try {
          if (fc.name === 'get_todo_status') {
            const todos = challengeTodoService.get_todo_status();
            console.log('📋 Returning todo status:', todos);

            result = {
              success: true,
              todos: todos,
              message: `You have ${todos.length} learning objectives. Completed: ${todos.filter(t => t.complete).length}`,
              async_operation: true
            };

          } else if (fc.name === 'mark_todo_complete') {
            const { todoId, isCorrect } = fc.args;
            console.log(`✅ Marking todo ${todoId} as complete (correct: ${isCorrect})`);

            const response = challengeTodoService.mark_todo_complete(todoId, isCorrect);
            
            // Update local state
            setTodos(challengeTodoService.get_todo_status());

            // Check if challenge is complete
            if (response.allComplete) {
              console.log('🎉 Challenge complete! All todos marked!');
              setTimeout(() => {
                setShowSuccessDialog(true);
              }, 2000); // Delay to let Piko finish speaking
            }

            result = {
              ...response,
              async_operation: true
            };

          } else {
            console.warn(`⚠️ Unknown function: ${fc.name}`);
            result = {
              success: false,
              error: `Unknown function: ${fc.name}`
            };
          }
        } catch (error) {
          console.error(`❌ Error in challenge function ${fc.name}:`, error);
          result = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
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

      if (functionResponses.length > 0) {
        console.log('📤 Sending challenge function responses:', functionResponses);
        setTimeout(() => {
          try {
            client.sendToolResponse({ functionResponses });
            console.log('✅ Challenge function responses sent');
          } catch (error) {
            console.error('❌ Error sending function responses:', error);
          }
        }, 10);
      }
    };

    if (client && challengeStarted) {
      client.on('toolcall', handleToolCall);
      return () => {
        client.off('toolcall', handleToolCall);
      };
    }
  }, [client, challengeStarted]);

  // Listen for todo updates from the service
  useEffect(() => {
    const handleTodoUpdate = () => {
      setTodos(challengeTodoService.get_todo_status());
    };

    window.addEventListener('challenge-todo-updated', handleTodoUpdate);
    window.addEventListener('challenge-todo-reset', handleTodoUpdate);

    return () => {
      window.removeEventListener('challenge-todo-updated', handleTodoUpdate);
      window.removeEventListener('challenge-todo-reset', handleTodoUpdate);
    };
  }, []);

  // Challenge intro handlers
  const handleStartChallenge = () => {
    console.log('🚀 Starting Piko Challenge!');
    setShowIntroCard(false);
    setChallengeStarted(true);
  };

  const handleLearnMore = () => {
    if (!challenge) return;

    const goals = challenge.todos
      .map(todo => `• ${todo.text}`)
      .join('\n');

    alert(`${challenge.title}\n\n${challenge.description}\n\nLearning goals:\n${goals}`);
  };

  // Success dialog handlers
  const handleContinueToLevel2 = () => {
    navigate('/piko-challenges');
  };

  const handleRestartChallenge = () => {
    console.log('🔄 Restarting challenge');
    challengeTodoService.reset_todos();
    setTodos(challengeTodoService.get_todo_status());
    setShowSuccessDialog(false);
    setShowIntroCard(true);
    setChallengeStarted(false);
  };

  const handleAvatarStateChange = useCallback((state: AvatarState) => {
    setAvatarState(state);
  }, []);

  const handleAvatarSubtitleChange = useCallback((subtitle: string) => {
    setCurrentAvatarSubtitle(subtitle);
  }, []);

  // Show loading or error states
  if (challengeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐼</div>
          <div style={{ fontSize: '1.5rem', color: '#666' }}>Loading challenge...</div>
        </div>
      </div>
    );
  }

  if (challengeError || !challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1.2rem', color: '#c00', marginBottom: '1rem' }}>
            {challengeError || 'Challenge not found'}
          </div>
          <button
            onClick={() => navigate('/piko-challenges')}
            style={{
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ← Back to Challenges Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn("avatar-interface", {
        connected,
        "video-bg-mode": true
      })}
      style={{
        backgroundImage: `url(${backgroundVideo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0
      }}
    >
      {/* Intro Card */}
      {showIntroCard && challenge && (
        <ChallengeIntroCard
          challenge={challenge}
          onStart={handleStartChallenge}
          onLearnMore={handleLearnMore}
          onClose={() => navigate('/piko-challenges')}
        />
      )}

      {/* Success Dialog */}
      {showSuccessDialog && challenge && (
        <ChallengeSuccessDialog
          challengeTitle={challenge.title}
          onContinue={handleContinueToLevel2}
          onRestart={handleRestartChallenge}
        />
      )}

      {!showIntroCard && (
        <>
          {/* Challenge Checklist (visible after challenge starts) */}
          {challengeStarted && (
            <ChallengeChecklist todos={todos} />
          )}

          <div 
            className="header-section"
            style={{ position: 'relative', zIndex: 101 }}
          >
            <div className="app-title">
              <h1 style={{ color: 'white' }}>Challenge: {challenge.title}</h1>
              <p style={{ color: 'white' }}>{challenge.category} • {challenge.difficulty}</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/piko-challenges')}
                className="back-to-landing-btn"
                style={{
                  background: '#16a34a',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ← Back to Hub
              </button>
              <div className="connection-status">
                <div className={cn('status-bubble', { connected })}>
                  {connected ? '● Connected' : '○ Disconnected'}
                </div>
              </div>
            </div>
          </div>

          <div 
            className="main-content-area"
            style={{
              position: 'relative',
              zIndex: 10
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="video-feed"
              style={{
                width: '320px',
                height: '240px',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0
              }}
            />

            <div className="panda-stage">
              <VideoExpressBuddyAvatar
                className="panda-container"
                isListening={isAvatarSpeaking}
                onAvatarStateChange={handleAvatarStateChange}
                onCurrentSubtitleChange={handleAvatarSubtitleChange}
                backgroundSrc="" 
                disableClickInteraction={true}
              />

              <Captions subtitleText={currentAvatarSubtitle} />

              <div className="panda-status">
                {avatarState.status === 'listening' && (
                  <div className="status-bubble listening">● Listening</div>
                )}
                {avatarState.status === 'processing' && (
                  <div className="status-bubble thinking">● Processing</div>
                )}
                {(avatarState.status === 'speaking' || isAvatarSpeaking) && (
                  <div className="status-bubble speaking">● Speaking</div>
                )}
              </div>
            </div>
          </div>

          <div className="controls-section">
            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
              disableChunkingToggle={true}
              currentBackground={backgroundVideo}
              onBackgroundChange={() => {}}
            />
          </div>
        </>
      )}
    </div>
  );
}
