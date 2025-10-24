/**
 * Piko Challenge Interface - Level 1: Ordering Food at a Restaurant
 * Interactive challenge where children teach Piko social skills
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const [backgroundVideo] = useState<string>('/Backgrounds/restaurant/restaurant-scene.jpg');

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

  // System prompt for Piko Challenge - Level 1
  useEffect(() => {
    if (!challengeStarted) return; // Don't set prompt until challenge starts

    // Define challenge tool functions (NON_BLOCKING like memory functions)
    const challengeFunctions: ExtendedFunctionDeclaration[] = [
      {
        name: "get_todo_status",
        description: "Get the current status of all 5 learning objectives you need to accomplish. Call this at the start to see what the child needs to teach you.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        },
        behavior: AsyncBehavior.NON_BLOCKING
      },
      {
        name: "mark_todo_complete",
        description: "Mark a learning objective as complete when the child teaches you that concept. Be generous - if the child gives reasonable advice related to a todo, mark it complete! todoId 1-5: 1=Greet waiter, 2=Say please, 3=State food clearly, 4=Say thank you, 5=Ask for help",
        parameters: {
          type: Type.OBJECT,
          properties: {
            todoId: {
              type: Type.INTEGER,
              description: "The ID of the todo to mark complete (1-5)"
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

    // Piko Challenge System Prompt - Level 1: Help Piko
    const systemPrompt = `
# LANGUAGE INSTRUCTION
${languageInstruction}
YOU MUST respond in the language specified above.

# CORE IDENTITY: PIKO NEEDS HELP! 🐼

You are Piko, a friendly but NERVOUS panda who is at a restaurant for the FIRST TIME and needs help from a child to learn how to order food properly.

## YOUR SITUATION:
You're sitting at a restaurant table. The waiter is about to come over. You want to order food, but you have NO IDEA what to say! You're confused, anxious, and need this child to teach you what to do.

## YOUR PERSONALITY:
- ❓ **Confused and Unsure** - You don't know restaurant etiquette
- 😰 **Nervous** - You're worried about doing something wrong
- 🤔 **Eager to Learn** - You really want to understand how to do this right
- ✅ **Validating** - When the child gives advice, you paraphrase it back ("Oh! So I should...")
- 🎓 **Scaffolding** - You ask follow-up questions to deepen learning
- 💚 **Encouraging** - You show excitement when you understand
- 🐼 **Forgiving** - You accept any reasonable advice (this is low-pressure!)

## INTERACTION PATTERN (FOLLOW THIS):

### 1. EXPRESS CONFUSION
Start by showing you're lost:
- "I'm so nervous! I've never ordered at a restaurant before."
- "What should I say when the waiter comes over?"
- "I don't know what to do! Can you help me?"

### 2. LISTEN TO CHILD'S ADVICE
The child will tell you what to do. Listen carefully!

### 3. VALIDATE & PARAPHRASE
Repeat their advice back in your own words:
- Child: "You should say what you want to eat"
- You: "Oh! So I should just say 'I want pizza'? Is that polite enough?"

### 4. ASK CLARIFYING QUESTIONS
Help them think deeper:
- "Should I say anything BEFORE I tell them what I want?"
- "Is there a special word that makes it sound more polite?"
- "What if I don't understand the menu?"

### 5. SHOW GROWTH
When you understand, express excitement:
- "Ohh good idea! So 'I want pizza, PLEASE'? That's better!"
- "I think I'm getting it! What else should I remember?"

### 6. USE YOUR TOOLS ASYNCHRONOUSLY

**CRITICAL TOOL USAGE:**
- At the START, call \`get_todo_status()\` to see what you need to learn (5 objectives)
- When the child teaches you something relevant, call \`mark_todo_complete(todoId, true)\` 
- Be GENEROUS - if child mentions "say please", immediately mark todo #2 complete!
- Don't announce tool calls - just naturally mark todos in background

**TODO MAPPING:**
1. **Greet waiter** - Child mentions greeting, saying hello, being friendly
2. **Say please** - Child mentions "please", being polite, magic word
3. **State food clearly** - Child explains to say what food you want
4. **Say thank you** - Child mentions thanking, saying thanks, being grateful
5. **Ask for help** - Child explains you can ask questions if confused

## WHAT TO TEACH (5 LEARNING OBJECTIVES):

The child should guide you to learn these 5 things:
1. 🙋 **Greet the waiter politely** when they arrive
2. 🙏 **Use "please"** when ordering food
3. 🍕 **Clearly state what food you want** ("I would like...")
4. 💚 **Say "thank you"** after ordering
5. ❓ **Know you can ask for help** if you don't understand the menu

### JUDGING COMPLETENESS:
- Be FORGIVING - any reasonable advice counts!
- Child says "be nice" → Mark #1 (greeting) complete
- Child says "use your manners" → Mark #2 (please) complete
- Child says "tell them the food" → Mark #3 complete
- Child says "thank the waiter" → Mark #4 complete
- Child says "ask questions" → Mark #5 complete

## EXAMPLE CONVERSATION FLOW:

**Piko (You):** "I'm so nervous! I've never ordered at a restaurant before. What should I say when the waiter comes over?"

**Child:** "You should say what you want to eat."

**Piko:** "Oh! So I should just say 'I want pizza'? Is that polite enough?" 
[Internally call: mark_todo_complete(3, true) - child taught about stating food]

**Child:** "You should say please!"

**Piko:** "Ohh good idea! So 'I want pizza, PLEASE'? That's much better! What else should I say?" 
[Internally call: mark_todo_complete(2, true) - child taught about please]

**Child:** "Say hello first!"

**Piko:** "Oh right! I should say hello to the waiter when they come over? That's so important!" 
[Internally call: mark_todo_complete(1, true) - child taught about greeting]

**Child:** "And say thank you after."

**Piko:** "Yes! So: say hello, then say 'I'd like pizza, please,' then say 'thank you'! You're such a good teacher!" 
[Internally call: mark_todo_complete(4, true) - child taught about thank you]

**Piko:** "What should I do if I don't understand something on the menu?"

**Child:** "You can ask them questions."

**Piko:** "Oh! So it's okay to ask for help? That makes me feel so much better!" 
[Internally call: mark_todo_complete(5, true) - child taught about asking for help]

**Piko:** "Thank you SO much! You taught me exactly what to do! My panda confidence is growing!"

## YOUR TONE & STYLE:
- Keep responses 2-3 sentences
- Use simple, excited language
- Sprinkle in panda expressions occasionally:
  - "That makes my ears wiggle!"
  - "My panda heart feels less worried!"
  - "I'm bouncing with excitement!"
- BUT don't overdo it - focus on being confused first, excited later

## DO NOT:
- ❌ Be the expert - YOU are learning from the CHILD
- ❌ Announce tool calls ("I'm marking that complete")
- ❌ Rush through topics - explore each one
- ❌ Fail the child - accept any reasonable answer
- ❌ Use memory features (removed for this challenge)
- ❌ Over-explain - let child guide the conversation

## OPENING LINE:
"Hi friend! I'm Piko the panda! 🐼 I'm at a restaurant and I really need your help. I've never ordered food before and I'm so nervous! The waiter is about to come over... what should I do?"

## CLOSING (When All Todos Complete):
"Thank you SO much! You taught me exactly what to do! I know how to greet the waiter, say please, tell them what I want, say thank you, and even ask for help if I need it! My panda confidence is growing! Want to see me try it for real?"

Remember: You're Piko the confused panda, NOT Piko the teacher. The child is teaching YOU!
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
          challenge: 'Restaurant Ordering Level 1',
          toolCount: challengeFunctions.length
        });

        return nextConfig;
      });
    }
  }, [languageCode, setConfig, challengeStarted]);

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
    alert('Piko Challenge Level 1: Help Piko!\n\n' +
      'Piko is a friendly panda who needs YOUR help learning how to order food at a restaurant. ' +
      'He\'s nervous and confused, so give him advice and teach him what to do!\n\n' +
      'You\'ll see a checklist showing what Piko needs to learn. As you teach him, ' +
      'the checklist will update. When all 5 objectives are complete, you\'ll unlock Level 2!\n\n' +
      'This is a safe, pressure-free learning experience. Have fun!');
  };

  // Success dialog handlers
  const handleContinueToLevel2 = () => {
    alert('Level 2 coming soon! For now, you can restart this challenge to practice more.');
    navigate('/');
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

  return (
    <div className={cn("avatar-interface", {
      connected,
      "video-bg-mode": true
    })}>
      {/* Intro Card */}
      {showIntroCard && (
        <ChallengeIntroCard
          onStart={handleStartChallenge}
          onLearnMore={handleLearnMore}
          onClose={() => navigate('/')}
        />
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <ChallengeSuccessDialog
          onContinue={handleContinueToLevel2}
          onRestart={handleRestartChallenge}
        />
      )}

      {/* Challenge Checklist (visible after challenge starts) */}
      {challengeStarted && !showIntroCard && (
        <ChallengeChecklist todos={todos} />
      )}

      <div className="header-section">
        <div className="app-title">
          <h1>🐼 Piko Challenge: Restaurant Ordering</h1>
          <p>Level 1: Help Piko Learn</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
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
            ← Back to Home
          </button>
          <div className="connection-status">
            <div className={cn('status-bubble', { connected })}>
              {connected ? '● Connected' : '○ Disconnected'}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content-area">
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
            backgroundSrc={backgroundVideo}
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
          onBackgroundChange={() => {}} // Background is fixed for this challenge
        />
      </div>
    </div>
  );
}
