# ExpressBuddy Live API - Complete Architecture Diagram

## 🎯 System Overview

This document provides a complete end-to-end architectural overview of how ExpressBuddy's video avatar, audio streaming, AI responses, and memory system work together to create an interactive conversational experience.

---

## 📊 High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXPRESBUDDY LIVE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   USER INTERFACE     │
                    │  (React Component)   │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼─────┐      ┌────────▼────────┐    ┌─────▼─────┐
    │  AUDIO   │      │  VIDEO AVATAR   │    │  HINTS &  │
    │ STREAMING│      │   (MP4 Videos)  │    │ GESTURES  │
    └────┬─────┘      └────────┬────────┘    └─────┬─────┘
         │                     │                    │
         └─────────────────────┼────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  LIVEAPI CONTEXT   │
                    │  (Central State)   │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼──────────┐   ┌─────▼──────┐    ┌────────▼─────┐
    │  GENAI LIVE   │   │  MEMORY    │    │ TRANSCRIPT   │
    │  CLIENT       │   │  SYSTEM    │    │ SERVICE      │
    └────┬──────────┘   └─────┬──────┘    └────────┬─────┘
         │                    │                    │
         │             ┌──────▼─────┐              │
         │             │ LOCALSTORAGE│             │
         │             └──────────────┘            │
         │                                    ┌────▼────┐
         │                                    │ SUPABASE│
         │                                    │   DB    │
         │                                    └─────────┘
         │
    ┌────▼──────────────────────────────┐
    │  GOOGLE GEMINI LIVE 2.5 FLASH API │
    │  (Multimodal Real-time)            │
    └────────────────────────────────────┘
```

---

## 🔄 Complete Data Flow: User Input → AI Response → Avatar Animation

### Phase 1: User Input Capture & Session Start

```
┌──────────────────────────────────────────────────────────────┐
│                    PHASE 1: SESSION INIT                      │
└──────────────────────────────────────────────────────────────┘

1. User loads MainInterfaceWithAvatar component
   │
   ├─ Initialize LiveAPIContext (use-live-api.ts)
   │  ├─ Create GenAILiveClient
   │  ├─ Setup AudioStreamer
   │  └─ Initialize Hint System
   │
   ├─ Load Memory System
   │  ├─ Define memory tools (write_to_memory, get_memories_by_keys)
   │  ├─ Build memory context from localStorage
   │  └─ Inject into system prompt
   │
   ├─ Connect to Gemini Live API
   │  ├─ Send system prompt with:
   │  │  ├─ Piko persona instructions
   │  │  ├─ Memory context section
   │  │  └─ Available memory tools
   │  └─ Status: CONNECTED ✓
   │
   ├─ Start Transcript Service
   │  └─ Initialize session recording
   │
   └─ Video Avatar Ready
      ├─ Load idle & talking MP4 videos
      └─ Display idle animation (IDLE STATE)
```

---

### Phase 2: User Speaks (Audio Input)

```
┌──────────────────────────────────────────────────────────────┐
│              PHASE 2: USER AUDIO INPUT                        │
└──────────────────────────────────────────────────────────────┘

1. User speaks into microphone
   │
   ├─ WebRTC Audio Stream → AudioStreamer
   │  ├─ Sample rate: 16kHz, PCM16 format
   │  ├─ Send audio chunks to Gemini Live API
   │  └─ Volume monitoring (real-time)
   │
   ├─ Transcript Service
   │  └─ Capture user transcription (speech-to-text via Gemini)
   │
   ├─ Avatar State Change
   │  └─ Audio activity detected
   │     ├─ Avatar volume increases
   │     └─ Visual feedback to user
   │
   └─ Google Gemini Processes
      ├─ Input Modality: AUDIO
      ├─ Output Modality: TEXT + AUDIO
      ├─ Built-in VAD (Voice Activity Detection)
      └─ Auto-triggers response generation
```

---

### Phase 3: Gemini AI Processing & Tool Calling

```
┌──────────────────────────────────────────────────────────────┐
│            PHASE 3: AI PROCESSING                             │
└──────────────────────────────────────────────────────────────┘

User Input → Gemini Live API
│
├─ DECISION: Does AI need to use tools?
│
├─ YES: Tool Calling Flow
│  │
│  ├─ Gemini decides to call memory functions
│  │  │
│  │  ├─ Tool: get_available_memory_keys()
│  │  │  └─ Behavior: NON_BLOCKING (async)
│  │  │     ├─ Doesn't block conversation
│  │  │     └─ Runs silently in background
│  │  │
│  │  ├─ Tool: get_memories_by_keys(keys: ['pet_name', 'favorite_sport'])
│  │  │  └─ Retrieves specific memories from localStorage
│  │  │     └─ Blends into response naturally
│  │  │
│  │  └─ Tool: write_to_memory(key: 'recent_experience', value: '...')
│  │     └─ Stores new information for next conversation
│  │        ├─ Saved to localStorage
│  │        └─ Available in future sessions
│  │
│  └─ Tool Call Handler (MainInterfaceWithAvatar.tsx)
│     ├─ Event: 'toolcall' received from client
│     ├─ Parse functionCalls array
│     ├─ Execute each tool synchronously
│     ├─ Build functionResponses array
│     └─ Send responses back to Gemini
│
│
└─ NO: Direct Response
   └─ Generate text response without tools
      └─ Stream chunks immediately
```

---

### Phase 4: AI Response Generation & Streaming

```
┌──────────────────────────────────────────────────────────────┐
│         PHASE 4: AI RESPONSE GENERATION                       │
└──────────────────────────────────────────────────────────────┘

Gemini Live API Streams Response
│
├─ Event: 'content' (Text chunks)
│  │
│  ├─ Response Buffer (useResponseBuffer)
│  │  ├─ Add chunk to buffer
│  │  ├─ Mark timestamp
│  │  └─ Auto-detect completion (2s timeout)
│  │
│  └─ Display in Captions Component
│     └─ Real-time subtitle display
│
├─ Event: 'setup' (Audio metadata)
│  │
│  ├─ Configure audio output
│  │  ├─ Sample rate info
│  │  └─ Audio format parameters
│  │
│  └─ Prepare audio buffer
│
├─ Event: 'media' (Audio chunks - PCM16)
│  │
│  ├─ Audio Buffering System
│  │  ├─ Collect audio chunks in audioBufferRef
│  │  ├─ Timestamp each chunk
│  │  └─ Monitor total buffered size
│  │
│  ├─ Check for interruption
│  │  └─ If user speaks → AI interrupts (handled by Gemini VAD)
│  │
│  └─ Process Complete Audio
│
├─ Event: 'turncomplete' (AI finished naturally)
│  │
│  └─ Process buffered audio:
│     ├─ Combine all audio chunks → single buffer
│     ├─ Send to audio playback
│     └─ Trigger avatar animation
│
└─ Event: 'interrupted' (User started speaking)
   │
   └─ Stop AI response:
      ├─ Interrupt audio playback
      ├─ Clear audio buffer
      ├─ Clear visemes/subtitles
      └─ Reset to listening state
```

---

## 🎬 Avatar State Machine

```
┌─────────────────────────────────────────────────────────────┐
│              AVATAR STATE MACHINE                             │
└─────────────────────────────────────────────────────────────┘

                         START
                          │
                          ▼
                    ┌─────────────┐
                    │   IDLE      │ ◄─┐
                    │  Animation  │   │
                    └─────┬───────┘   │
                          │           │
        ┌─────────────────┘           │
        │ (AI Turn Starts)            │
        │ onAITurnStart()             │
        │                             │
        ▼                             │
    ┌─────────────────────────────┐   │
    │    BUFFERING STATE          │   │
    │  Accumulating audio chunks  │   │
    │  isBuffering: true          │   │
    └─────────┬───────────────────┘   │
              │                       │
    ┌─────────┴───────────────┐       │
    │                         │       │
    ▼                         ▼       │
┌─────────────┐      ┌──────────────┐│
│ Collecting  │      │   Rendering  ││
│   Audio     │      │    Visemes   ││
│   Chunks    │      │  (if enabled)││
└─────────────┘      └──────────────┘│
    │                         │      │
    └─────────────┬───────────┘      │
                  │                  │
                  ▼                  │
          ┌──────────────────┐       │
          │  Complete Audio  │       │
          │    Available     │       │
          └────────┬─────────┘       │
                   │                 │
    ┌──────────────┼──────────────┐  │
    │              │              │  │
    ▼              ▼              ▼  │
┌────────┐ ┌─────────┐ ┌──────────┐ │
│ PLAY   │ │VISEME   │ │ AVATAR   │ │
│ AUDIO  │ │SYNC     │ │ANIMATION │ │
│        │ │ FRAME   │ │ TALKING  │ │
└────────┘ └─────────┘ └──────────┘ │
    │          │           │        │
    └──────────┴───────────┴────────┤
                   │                 │
                   ▼                 │
           ┌─────────────────┐       │
           │  AI Turn        │       │
           │  Complete       │       │
           │  onAITurnComplete()    │
           └────────┬────────┘       │
                    │                │
                    └────────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │   IDLE      │
                    │  Animation  │
                    └─────────────┘
```

### Avatar State Details:

**IDLE STATE**
- Playing: Idle animation loop (Pandaalter1_2.mp4)
- Video: Continuous playback with chroma-key (green screen removed)
- Canvas: Opacity 1.0
- User can interrupt to speak

**BUFFERING STATE**
- Audio chunks accumulating from Gemini
- isBuffering: true
- Avatar preparing for response

**TALKING STATE**
- Playing: Talking animation (PandaTalkingAnim.mp4)
- Canvas: Opacity transitions to 1.0
- Audio streaming to speaker
- Subtitles displayed

**TRANSITION LOGIC**
```typescript
// In VideoExpressBuddyAvatar.tsx
useEffect(() => {
  const targetState = isListening ? 'talking' : 'idle';
  if (targetState !== currentState && isLoaded) {
    setCurrentState(targetState);
    if (targetState === 'talking') {
      playTalkingAnimation();  // Show talking video
    } else {
      playIdleAnimation();     // Show idle video
    }
  }
}, [isListening, currentState, isLoaded]);
```

---

## 🎥 Video Avatar Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│           VIDEO AVATAR RENDERING PIPELINE                    │
└─────────────────────────────────────────────────────────────┘

                    MP4 Video Files
                    (Streaming)
                         │
        ┌────────────────┬┴────────────────┐
        │                │                 │
    ┌───▼──────┐    ┌────▼─────┐    ┌─────▼──┐
    │  IDLE    │    │ TALKING   │    │BACKGROUND
    │VIDEO     │    │ VIDEO     │    │ VIDEO
    │2.mp4     │    │ Anim.mp4  │    │1.mp4
    └───┬──────┘    └────┬─────┘    └─────┬──┘
        │                │               │
        └────────────────┼───────────────┘
                         │
                ┌────────▼────────┐
                │ HTMLVideoElements
                │ (3 elements)    │
                └────────┬────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ idleVideoRef│   │talkingVideoRef
│             │   │             │   │backgroundRef│
│ (canvas)    │   │ (canvas)    │   │ (behind)    │
└─────┬───────┘   └─────┬───────┘   └─────────────┘
      │                 │
      └─────────────┬───┘
                    │
        ┌───────────▼──────────┐
        │  CHROMA KEY EFFECT   │
        │  (Green screen remove)
        │                      │
        │ For each frame:      │
        │ 1. Draw video frame  │
        │ 2. Extract pixels    │
        │ 3. If green-dominant │
        │    → Set alpha = 0   │
        │ 4. Put back pixels   │
        │ 5. RequestAnimFrame  │
        └───────────┬──────────┘
                    │
        ┌───────────▼──────────┐
        │  CANVAS BLENDING     │
        │                      │
        │ Based on state:      │
        │ - IDLE: opacity 1.0  │
        │ - TALKING: smooth    │
        │   transition         │
        └───────────┬──────────┘
                    │
                    ▼
            ┌──────────────┐
            │ FINAL VIDEO  │
            │   OUTPUT     │
            │  (On Screen) │
            └──────────────┘

Performance Notes:
- Both videos play continuously (no start/stop)
- Canvas is updated every frame for smooth transitions
- Chroma key runs in requestAnimationFrame loop
- Resolution: Matches video dimensions (maintained)
- FPS: 60fps target for smooth animation
```

---

## 💾 Memory System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              MEMORY SYSTEM (NON-BLOCKING)                    │
└─────────────────────────────────────────────────────────────┘

                    CONVERSATION STARTS
                           │
                ┌──────────▼──────────┐
                │  Memory Tools      │
                │  Configuration     │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────────┐ ┌────────────────┐ ┌─────────────────┐
│ write_to_memory  │ │get_available   │ │get_memories_    │
│                  │ │memory_keys     │ │by_keys          │
│ Params:          │ │                │ │                 │
│ - key (string)   │ │ Returns:       │ │ Params:         │
│ - value (string) │ │ - keys: []     │ │ - keys: []      │
│                  │ │                │ │                 │
│ Behavior:        │ │ Behavior:      │ │ Behavior:       │
│ NON_BLOCKING     │ │ NON_BLOCKING   │ │ NON_BLOCKING    │
└──────────┬───────┘ └────────┬───────┘ └────────┬────────┘
           │                  │                  │
           ├─ Async execution ─┤                 │
           ├─ No blocking ─────┤                 │
           └─ Silent scheduling ┘                 │
                                                  │
                                   When Gemini calls:
                                   │
                   ┌───────────────┼───────────────┐
                   │               │               │
                   ▼               ▼               ▼
        ┌──────────────────┐ ┌──────────────┐ ┌──────────┐
        │ write_to_memory  │ │ get_available│ │get_memories
        │                  │ │_memory_keys  │ │_by_keys
        │ Event: 'toolcall'│ │              │ │
        └─────────┬────────┘ └────────┬─────┘ └────┬─────┘
                  │                   │            │
        ┌─────────┴───────┐   ┌───────┴──────┐    │
        │                 │   │              │    │
        ▼                 ▼   ▼              ▼    │
    ┌─────────────────────────────────┐          │
    │  Handle Tool Call (Async)       │          │
    │                                 │          │
    │ 1. Extract function calls       │          │
    │ 2. Execute each tool silently   │          │
    │ 3. Build responses              │          │
    │ 4. Send back to Gemini          │          │
    │                                 │          │
    │ Scheduling: SILENT              │          │
    │ - No announcements              │          │
    │ - No UI interruption            │          │
    │ - Runs in background            │          │
    └─────┬───────────────────────────┘          │
          │                                      │
          ▼                                      │
┌──────────────────────────────────┐            │
│ Execute Tool Implementations     │            │
└──────────┬───────────────────────┘            │
           │                                    │
    ┌──────┴────────┐                          │
    │               │                          │
    ▼               ▼                          │
┌────────────┐  ┌─────────────────┐           │
│localStorage│  │Supabase (if RLS)│           │
│            │  │ (conversation   │           │
│Keys:       │  │ transcripts)    │           │
│- pet_name  │  │                 │           │
│- interests │  │ Not currently   │           │
│- recent_exp│  │ used for memory │           │
│- school    │  │                 │           │
│- emotions  │  └─────────────────┘           │
└────────────┘                                │
    │                                         │
    └─ Return to Gemini ◄────────────────────┘

Storage Details:
┌────────────────────────────────────┐
│       LOCALSTORAGE STRUCTURE       │
├────────────────────────────────────┤
│ Key: `expresbuddy_memory_<key>`   │
│ Value: Stored string (JSON safe)  │
│ Type: Persistent (session persist)│
│ Limit: ~5MB per domain            │
│ Scope: Browser only               │
└────────────────────────────────────┘

Memory Integration in System Prompt:
┌────────────────────────────────────┐
│    SYSTEM PROMPT ENHANCEMENT       │
├────────────────────────────────────┤
│ 1. Build memory context section    │
│ 2. Inject into system prompt       │
│ 3. Include all stored memories     │
│ 4. Make memories available to AI   │
│ 5. Encourage natural reference     │
│ 6. Prevent "I stored that" phrases │
└────────────────────────────────────┘

Example Memory Usage:
Child: "I have a dog named Max"
  ↓
Gemini decides to store:
  ↓
write_to_memory(
  key: 'pet_name',
  value: 'Max - a dog'
)
  ↓
Stored in localStorage as:
  expresbuddy_memory_pet_name = "Max - a dog"
  ↓
Next session:
  ↓
get_memories_by_keys(['pet_name'])
  ↓
Returns: {pet_name: "Max - a dog"}
  ↓
Built into prompt context
  ↓
Gemini: "How's Max doing?" (natural reference)
```

---

## 📞 Tool Calling & Help System

```
┌─────────────────────────────────────────────────────────────┐
│             TOOL CALLING SYSTEM (HINTS)                      │
└─────────────────────────────────────────────────────────────┘

USER INTERACTION → Help/Hint System
│
├─ SPACE BAR HOLD (detected by use-hint-system.ts)
│  │
│  ├─ Hint System Triggers
│  │  ├─ onShowHintIndicator() → Display UI feedback
│  │  ├─ onHintTriggered() → Send hint message
│  │  └─ onAnalyticsEvent() → Log analytics
│  │
│  └─ Send Hint to Gemini
│     │
│     └─ sendHintToGemini(message: string)
│        ├─ Check connection: connected && client.status === 'connected'
│        ├─ Verify WebSocket active: client.session exists
│        └─ Send text Part to Gemini
│           │
│           └─ client.send(textPart, true)
│              │
│              └─ Message travels through GenAILiveClient
│                 │
│                 └─ Gemini receives as user input
│
├─ Hint Types
│  ├─ Nudge: "I'm stuck"
│  ├─ Help: "Can you explain?"
│  ├─ Skip: "Let's try something else"
│  └─ Encouragement: "Tell me if you get stuck!"
│
└─ Hint Indicator UI
   ├─ NudgeIndicator component
   ├─ Shows when hint system is active
   ├─ Displays hint suggestions
   └─ Allows user to select hint type


TOOL CALL LIFECYCLE:
─────────────────

1. DEFINITION PHASE
   ├─ Define memory function declarations
   ├─ Create Tool object
   ├─ Pass to setConfig()
   └─ Tools available to Gemini


2. GEMINI DECISION PHASE
   ├─ User input arrives
   ├─ Gemini processes with tools available
   ├─ Decides: "Do I need a tool?"
   └─ If YES → Prepare tool call


3. TOOLCALL EVENT
   ├─ Event: 'toolcall' received
   │
   ├─ Parse tool call structure:
   │  ├─ toolCall.functionCalls[0].name
   │  ├─ toolCall.functionCalls[0].args
   │  └─ Multiple function calls possible
   │
   ├─ Execute tool synchronously
   │  ├─ Call: write_to_memory(args)
   │  ├─ Call: get_memories_by_keys(args)
   │  └─ Call: get_available_memory_keys()
   │
   └─ Build response


4. RESPONSE BUILD
   ├─ Create functionResponses array
   ├─ For each tool call:
   │  ├─ toolName: function name
   │  ├─ id: match tool call id
   │  └─ response: execution result
   │
   └─ Example response:
      {
        toolName: 'get_memories_by_keys',
        id: 'call_123',
        response: {
          pet_name: 'Max - a dog',
          favorite_sport: 'Soccer'
        }
      }


5. SEND BACK TO GEMINI
   ├─ Send functionResponses
   ├─ Gemini receives results
   ├─ Gemini generates response using tool results
   └─ Continue conversation normally


ERROR HANDLING:

Try/Catch blocks for:
├─ Connection check fails
│  └─ Throw: "Not connected to Gemini"
│
├─ WebSocket not active
│  └─ Throw: "WebSocket is not connected, cannot send message"
│
├─ Tool execution error
│  └─ Log error, return error response
│
└─ Network issues
   └─ Retry logic or fail gracefully
```

---

## 🔊 Audio Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│            AUDIO PROCESSING PIPELINE                         │
└─────────────────────────────────────────────────────────────┘

                    USER SPEAKS
                         │
                ┌────────▼────────┐
                │  WebRTC Audio   │
                │  Stream Input   │
                │  16kHz, PCM16   │
                └────────┬────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
    ┌─────────────┐            ┌──────────────────┐
    │AudioStreamer│            │ Transcript       │
    │   (Sending) │            │ Service (Record) │
    │             │            │                  │
    │ - PCM16     │            │ addUserTrans()   │
    │   chunks    │            │                  │
    │ - Volume    │            │ Stores:          │
    │   metering  │            │ - timestamp      │
    │             │            │ - speaker: 'user'
    └─────┬───────┘            │ - text: STT      │
          │                    └──────────────────┘
          │
          ▼
    ┌──────────────────┐
    │ Gemini Live API  │
    │ (Processing)     │
    │                  │
    │ Input modality:  │
    │ - AUDIO          │
    │ - TEXT (from STT)│
    │                  │
    │ Output modality: │
    │ - TEXT (content) │
    │ - AUDIO (response)
    │                  │
    │ Special events:  │
    │ - 'turncomplete' │
    │ - 'interrupted'  │
    │ - 'setup'        │
    │ - 'media'        │
    └────────┬─────────┘
             │
    ┌────────┴─────────────────────┐
    │    RESPONSE STREAM            │
    │    (Events)                   │
    │                               │
    │ 1. 'setup' - metadata         │
    │ 2. 'media' - audio chunks     │
    │ 3. 'content' - text chunks    │
    │ 4. 'turncomplete'             │
    │                               │
    └────────┬─────────────────────┘
             │
    ┌────────┴──────────────────────────────────┐
    │     AUDIO BUFFERING SYSTEM                 │
    │                                            │
    │ audioBufferRef.current = []                │
    │                                            │
    │ As 'media' events arrive:                  │
    │ 1. audioBufferRef.push(audioChunk)         │
    │ 2. setIsBuffering(true)                    │
    │ 3. Track total length                      │
    │                                            │
    │ Interruption check:                        │
    │ - If user speaks → VAD signals "interrupted"
    │ - Call interruptAIPlayback()               │
    │   - audioStreamer.stop()                   │
    │   - Clear audioBuffer                      │
    │   - Reset playback state                   │
    │                                            │
    └────────┬──────────────────────────────────┘
             │
    When 'turncomplete' event arrives:
             │
             ▼
    ┌──────────────────────────────┐
    │ processCompleteAudio()       │
    │                              │
    │ 1. Check if buffer empty     │
    │ 2. Combine all chunks        │
    │    audioBufferRef → Uint8Array
    │ 3. Create pendingCompleteAudio
    │                              │
    │ 4. Play audio:               │
    │    audioStreamer.addPCM16()  │
    │                              │
    │ 5. Track for replay:         │
    │    lastCompleteAudioRef =    │
    │    combinedAudio             │
    │                              │
    │ 6. Clean up:                 │
    │    - Clear audioBuffer       │
    │    - Clear timeout           │
    │    - setIsBuffering(false)   │
    │                              │
    └────────┬─────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ AUDIO OUTPUT         │
    │ (Speaker)            │
    │                      │
    │ - Real-time playback │
    │ - Synchronized to    │
    │   avatar animation   │
    │ - Volume control     │
    │                      │
    └─────────────────────┘

Transcript Service Integration:
│
├─ Capture AI audio as it streams
│  └─ When audio processing complete:
│     └─ addAITranscription(text, metadata)
│
├─ Buffer transcriptions intelligently
│  ├─ Wait for speaking pause (700ms)
│  ├─ Combine fragments into utterances
│  └─ Store in currentTranscript array
│
└─ Save conversation when session ends
   ├─ endConversationAndSave()
   ├─ Format data for Supabase
   ├─ Insert into conversation_transcripts table
   └─ Include statistics (duration, msg count, etc)
```

---

## 🔄 Complete User Journey: Start to Finish

```
┌────────────────────────────────────────────────────────────────┐
│         COMPLETE USER JOURNEY TIMELINE                          │
└────────────────────────────────────────────────────────────────┘

T=0s: User opens application
├─ App.tsx loads MainInterfaceWithAvatar component
├─ LiveAPIProvider initializes
│  ├─ Create GenAILiveClient instance
│  ├─ Setup audio streaming
│  └─ Initialize memory system
├─ Load stored memories from localStorage
├─ Build memory context for system prompt
└─ UI Status: "Connecting..."

T=1s: Connection established
├─ Connect to Gemini Live API
├─ Send system prompt with:
│  ├─ Piko persona
│  ├─ Memory context
│  └─ Available tools (memory functions)
├─ Event listeners registered
│  ├─ 'toolcall' handler
│  ├─ 'content' handler
│  ├─ 'media' handler
│  ├─ 'turncomplete' handler
│  ├─ 'interrupted' handler
│  └─ 'setup' handler
├─ Video avatar loads and displays IDLE animation
└─ UI Status: "Ready! Start talking..."

T=2s: User speaks
├─ Audio stream activated
├─ User starts saying: "Hi Piko! I have a new pet dog named Max!"
├─ Microphone captures audio at 16kHz PCM16
├─ Audio streamer sends chunks to Gemini
├─ Transcript service captures: "Hi Piko! I have a new pet dog named Max!"
├─ Avatar receives audio activity → subtle volume changes
└─ Gemini processes incoming audio

T=3s: Gemini starts responding
├─ Gemini analyzes input with tools available
├─ Gemini decides: "I should remember this pet!"
├─ Gemini signals it will use tools
├─ toolcall event fires:
│  ├─ functionCall[0].name = "write_to_memory"
│  ├─ functionCall[0].args = {
│  │  ├─ key: "pet_name",
│  │  └─ value: "Max - a dog"
│  │ }
│  └─ Tool call handled asynchronously
│
├─ Memory stored in localStorage:
│  └─ expresbuddy_memory_pet_name = "Max - a dog"
│
└─ Gemini generates response text:
   └─ "Oh wow! A dog named Max! That's so cool! I'm so excited to meet Max..."

T=4s: Response streams in
├─ 'setup' event → audio format configured
├─ 'content' event → text chunks received
│  ├─ Chunk 1: "Oh wow! A dog"
│  ├─ Chunk 2: " named Max! That's"
│  ├─ Chunk 3: " so cool!"
│  └─ Display in Captions component (real-time)
│
├─ 'media' event → audio chunks received
│  ├─ Audio chunk 1 → buffered
│  ├─ Audio chunk 2 → buffered
│  ├─ Audio chunk 3 → buffered
│  ├─ ... chunks accumulate ...
│  └─ Audio buffer growing
│
├─ isBuffering = true
├─ Avatar state: BUFFERING
└─ User sees subtitles appearing

T=5s: AI finishes generation
├─ 'turncomplete' event fires
├─ processCompleteAudio() executes:
│  ├─ Combine all audio chunks into single buffer
│  ├─ Size: ~32KB of PCM16 audio
│  ├─ Play audio via audioStreamer.addPCM16()
│  └─ Store in lastCompleteAudioRef for potential replay
│
├─ Audio starts playing through speaker
├─ Avatar transitions: BUFFERING → TALKING
│  ├─ Fade out idle animation
│  ├─ Fade in talking animation
│  └─ Chroma key filters applied to both
│
├─ onAITurnStart() callback fires
│  └─ Visual feedback to indicate AI is speaking
│
└─ Subtitles continue to update as text streams

T=6s: Avatar speaking while audio plays
├─ Audio streaming to speaker (7 seconds of content)
├─ Avatar talking animation looping
├─ Subtitles displaying full text:
│  └─ "Oh wow! A dog named Max! That's so cool! I'm so excited to meet Max..."
│
└─ User can interrupt anytime by speaking

T=7s: AI finishes completely
├─ Audio finishes playing (end of buffer)
├─ Last subtitle displayed
├─ onAITurnComplete() callback fires
│  └─ Avatar transitions: TALKING → IDLE
├─ Avatar back to idle animation
├─ System ready for next input
├─ Transcript service captures AI output:
│  └─ addAITranscription("Oh wow! A dog named Max! That's so cool!...")
│
└─ UI Status: "Ready! Your turn to speak..."

T=8s: User speaks again
├─ User says: "Yes! He loves to play fetch"
├─ Same flow repeats:
│  ├─ Audio capture
│  ├─ Transcript service logs input
│  ├─ Gemini processes
│  ├─ Gemini checks if tools needed
│  ├─ (This time: maybe save favorite activity)
│  ├─ Response generated
│  ├─ Audio buffered and played
│  ├─ Avatar animations synchronized
│  └─ Subtitles updated
│
└─ Conversation flows naturally...

T=60s: User ends session
├─ User clicks "End Session" or closes app
├─ Disconnect from Gemini Live API
├─ Transcript service called:
│  ├─ endConversationAndSave()
│  ├─ Flush any pending buffers
│  ├─ Compile full conversation statistics:
│  │  ├─ Total messages: 8
│  │  ├─ User messages: 4
│  │  ├─ AI messages: 4
│  │  ├─ Duration: 58 seconds
│  │  └─ Session ID: UUID
│  │
│  └─ Save to Supabase:
│     ├─ INSERT into conversation_transcripts
│     ├─ Store full conversation JSON
│     ├─ Store metadata (device, browser, etc)
│     └─ Success: ✓ Conversation saved
│
├─ Audio streamer stopped
├─ Memory system preserved
│  └─ All new memories remain in localStorage
│     └─ Can be recalled in next session
│
└─ UI Status: "Session ended"

NEXT SESSION (Later):
├─ User opens application again
├─ Memory system initialized
├─ Gemini receives system prompt with:
│  └─ "The user has a dog named Max who loves to play fetch"
│
├─ User speaks: "Tell me about my dog!"
├─ Gemini naturally references memory:
│  └─ "Max the dog who loves fetch! How is he doing today?"
│
└─ Conversation continues seamlessly...
```

---

## 🎭 State Flow Diagram: Summary

```
┌───────────────────────────────────────────────────┐
│         COMPLETE SYSTEM STATE FLOW                │
└───────────────────────────────────────────────────┘

          ┌──────────────────────┐
          │  APPLICATION START   │
          └──────────┬───────────┘
                     │
        ┌────────────▼────────────┐
        │ INITIALIZE LIVEAPI      │
        │ - Create client         │
        │ - Setup audio           │
        │ - Load memories         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  CONNECT TO GEMINI      │
        │  - Send system prompt   │
        │  - Register listeners   │
        │  - Status: CONNECTED ✓  │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │  AVATAR: IDLE STATE     │
        │  - Idle animation       │
        │  - Ready for input      │
        │  - Listening            │
        └────────────┬────────────┘
                     │
    ┌────────────────┴────────────────┐
    │ USER SPEAKS (Audio Input)       │
    │ ↓                               │
    │ Gemini Processes                │
    │ ↓                               │
    │ Decide: Use tools?              │
    │                                 │
    ├─YES: Tool Calling Phase         │
    │ ├─ Execute memory tools         │
    │ ├─ Send results back            │
    │ └─ Generate response            │
    │                                 │
    └─NO: Direct Response             │
        └─ Generate response directly │
            ↓                         │
    ┌───────────────────────────┐    │
    │ RESPONSE STREAMING PHASE   │   │
    ├───────────────────────────┤    │
    │ 1. 'setup' event          │    │
    │ 2. 'media' events (audio) │    │
    │ 3. 'content' events (text)│    │
    │ 4. 'turncomplete'         │    │
    └────────────┬──────────────┘    │
                 │                   │
        ┌────────▼─────────────┐     │
        │ AVATAR: BUFFERING    │     │
        │ - Audio accumulates  │     │
        │ - isBuffering: true  │     │
        │ - Subtitles showing  │     │
        └────────┬─────────────┘     │
                 │                   │
        ┌────────▼─────────────┐     │
        │ AUDIO PLAYBACK       │     │
        │ - Audio ready        │     │
        │ - Start streaming    │     │
        └────────┬─────────────┘     │
                 │                   │
        ┌────────▼─────────────┐     │
        │ AVATAR: TALKING      │     │
        │ - Talking animation  │     │
        │ - Audio playing      │     │
        │ - Subtitles visible  │     │
        └────────┬─────────────┘     │
                 │                   │
        ┌────────▼─────────────┐     │
        │ SAVE TRANSCRIPTS     │     │
        │ - Add to session log │     │
        └────────┬─────────────┘     │
                 │                   │
        ┌────────▼─────────────┐     │
        │ AVATAR: IDLE STATE   │     │
        │ - Idle animation     │     │
        │ - Ready for next     │     │
        │ - Listening          │     │
        └────────┬─────────────┘     │
                 │                   │
        Continue loop ◄───────────────┘
```

---

## 📋 Component Responsibility Matrix

```
┌─────────────────────────────────────────────────────┐
│    COMPONENT INTERACTION & RESPONSIBILITIES         │
└─────────────────────────────────────────────────────┘

MainInterfaceWithAvatar (Main Container)
├─ Responsibilities:
│  ├─ System prompt setup with memory context
│  ├─ Tool call handling (memory functions)
│  ├─ Streaming content processing
│  ├─ Avatar state management
│  ├─ Transcript service integration
│  └─ Overall orchestration
│
├─ Key Hooks Used:
│  ├─ useLiveAPIContext()
│  ├─ useResponseBuffer()
│  ├─ useLoggerStore()
│  └─ Standard React hooks
│
└─ Children Components:
   ├─ VideoExpressBuddyAvatar (Render)
   ├─ Captions (Display subtitles)
   ├─ ControlTray (User controls)
   └─ NudgeIndicator (Hint system)

────────────────────────────────

LiveAPIContext (State Management)
├─ Responsibilities:
│  ├─ Client instance management
│  ├─ Connection state
│  ├─ Audio streaming
│  ├─ Volume monitoring
│  ├─ Hint system
│  ├─ Config updates
│  └─ Avatar animation callbacks
│
├─ Key Methods:
│  ├─ connect()
│  ├─ disconnect()
│  ├─ sendHintToGemini()
│  ├─ onAITurnStart()
│  ├─ onAITurnComplete()
│  └─ Event emission
│
└─ Provides:
   ├─ GenAILiveClient instance
   ├─ Configuration state
   ├─ Connection status
   ├─ Volume data
   ├─ Hint system
   └─ Tool callbacks

────────────────────────────────

VideoExpressBuddyAvatar (Rendering)
├─ Responsibilities:
│  ├─ Video animation rendering
│  ├─ Chroma key effect (green screen)
│  ├─ Canvas blending
│  ├─ State transitions (idle ↔ talking)
│  └─ Visual feedback
│
├─ State:
│  ├─ currentState: 'idle' | 'talking'
│  ├─ isListening: boolean prop
│  ├─ isLoaded: boolean
│  └─ error: string | null
│
└─ Callbacks:
   ├─ onAvatarStateChange()
   ├─ onPlaybackStateChange()
   └─ onCurrentSubtitleChange()

────────────────────────────────

TranscriptService (Data Logging)
├─ Responsibilities:
│  ├─ Capture user transcriptions
│  ├─ Capture AI transcriptions
│  ├─ Buffer fragments intelligently
│  ├─ Compile conversation stats
│  ├─ Save to Supabase
│  └─ Retrieve recent transcripts
│
├─ Key Methods:
│  ├─ startConversation()
│  ├─ addUserTranscription()
│  ├─ addAITranscription()
│  ├─ endConversationAndSave()
│  └─ getSessionStatus()
│
└─ Storage:
   └─ Supabase table: conversation_transcripts

────────────────────────────────

useHintSystem Hook (Help System)
├─ Responsibilities:
│  ├─ Detect space bar hold
│  ├─ Trigger hint callbacks
│  ├─ Track hint analytics
│  ├─ Display hint indicator
│  └─ Manage hint state
│
├─ Callbacks:
│  ├─ onHintTriggered()
│  ├─ onShowHintIndicator()
│  └─ onAnalyticsEvent()
│
└─ Features:
   ├─ Multiple hint types
   ├─ Visual feedback
   ├─ Analytics tracking
   └─ Non-blocking execution

────────────────────────────────

useResponseBuffer Hook (Text Buffering)
├─ Responsibilities:
│  ├─ Buffer streaming text chunks
│  ├─ Detect completion (2s timeout)
│  ├─ Provide accumulated text
│  └─ Auto-reset on completion
│
├─ Methods:
│  ├─ addChunk()
│  ├─ markComplete()
│  └─ reset()
│
└─ State:
   ├─ chunks: string[]
   ├─ isComplete: boolean
   ├─ completeText: string
   └─ lastChunkTime: number
```

---

## 🔐 Memory Flow Example: Detailed

```
┌────────────────────────────────────────────────────────────┐
│      MEMORY SYSTEM EXAMPLE: STORING & RETRIEVING           │
└────────────────────────────────────────────────────────────┘

SCENARIO: Child tells Piko about their favorite animal

USER: "I really love elephants! They're my favorite!"
  │
  ├─ Captured by: Transcript service
  │  └─ addUserTranscription()
  │
  └─ Sent to: Gemini Live API
     │
     ├─ Process: Gemini understands preference
     │
     ├─ Decision: "Should I remember this?"
     │  └─ YES! This is important context
     │
     └─ Action: Call memory tool
        │
        ├─ Function call:
        │  {
        │    name: "write_to_memory",
        │    args: {
        │      key: "favorite_animal",
        │      value: "Elephants - really loves them!"
        │    }
        │  }
        │
        └─ Behavior: NON_BLOCKING
           ├─ Scheduled silently
           ├─ Doesn't block response
           └─ Runs asynchronously


STORAGE (localStorage):
┌──────────────────────────────────────────────┐
│ Key: "expresbuddy_memory_favorite_animal"    │
│ Value: "Elephants - really loves them!"      │
│ Scope: Browser persistence                   │
└──────────────────────────────────────────────┘


GEMINI RESPONDS (natural):
├─ Uses tool response implicitly
├─ Generates: "Elephants are amazing! They're so smart 
│  and strong. I love how they help each other as a 
│  family. What do you like most about them?"
│
└─ NO ANNOUNCEMENT needed (like "I stored that...")
   └─ Natural conversation flows


LATER IN SESSION: Gemini needs context
│
├─ Gemini considers:
│  "Do I need to know their preferences?"
│
├─ Decision: Call memory tool
│  │
│  └─ Function call:
│     {
│       name: "get_memories_by_keys",
│       args: {
│         keys: ["favorite_animal", "pet_name", "favorite_sport"]
│       }
│     }
│
└─ Behavior: NON_BLOCKING
   ├─ Retrieves from localStorage
   ├─ Returns:
   │  {
   │    favorite_animal: "Elephants - really loves them!",
   │    pet_name: "Max - a dog",
   │    favorite_sport: "Soccer"
   │  }
   │
   └─ Gemini naturally weaves in:
      "You love elephants and soccer! And Max must be 
       happy when you play fetch with him!"


NEXT SESSION (Days later):
│
├─ User opens app again
│
├─ System loads from localStorage:
│  ├─ favorite_animal: "Elephants - really loves them!"
│  ├─ pet_name: "Max - a dog"
│  ├─ favorite_sport: "Soccer"
│  └─ (+ any other stored memories)
│
├─ Memory context added to system prompt:
│  {
│    "The child loves elephants and soccer. They have a 
│     dog named Max. Remember to be warm and reference 
│     their interests naturally without announcing that 
│     you're using memory."
│  }
│
├─ Conversation starts fresh but with context
│
└─ User: "Hi Piko!"
   │
   └─ Piko naturally: "Hey! How's Max doing? Did you 
      get to play soccer lately? Have you thought more 
      about those awesome elephants?"
      
      (Natural memory integration - no "I remember that you...")
```

---

## 🛡️ Error Handling & Recovery

```
┌────────────────────────────────────────────────────────┐
│    ERROR HANDLING & RECOVERY STRATEGIES               │
└────────────────────────────────────────────────────────┘

CONNECTION ERRORS:
├─ Problem: Cannot connect to Gemini Live API
├─ Detection: connection = false
├─ Recovery:
│  ├─ Show UI message: "Connecting..."
│  ├─ Retry logic in connect()
│  ├─ Exponential backoff (1s, 2s, 4s)
│  └─ Max retries: 3
│
└─ Fallback: Show "Please refresh and try again"

AUDIO ERRORS:
├─ Problem: Microphone access denied
├─ Detection: getUserMedia() fails
├─ Recovery:
│  ├─ Check browser permissions
│  ├─ Request permission again
│  └─ Show: "Please allow microphone access"
│
└─ Fallback: Disable audio input (text only)

WEBSOCKET ERRORS:
├─ Problem: WebSocket disconnects unexpectedly
├─ Detection: client.session becomes null
├─ Recovery:
│  ├─ Keep-alive mechanism (30s intervals)
│  ├─ Auto-reconnect on disconnect
│  └─ Preserve conversation state
│
└─ Implementation:
   keepAliveInterval = setInterval(() => {
     if (connected && lastActivityTime old) {
       Send keep-alive ping
     }
   }, 30000)

TOOL CALL ERRORS:
├─ Problem: Tool execution fails
├─ Detection: Try/catch in tool handler
├─ Recovery:
│  ├─ Log error with details
│  ├─ Return error response to Gemini
│  ├─ Gemini can recover gracefully
│  └─ Continue conversation
│
└─ Example:
   try {
     Execute tool
   } catch (error) {
     Log error
     Return: {
       toolName: functionName,
       id: call_id,
       response: { error: error.message }
     }
   }

AUDIO PLAYBACK ERRORS:
├─ Problem: Audio won't play from speaker
├─ Detection: audioStreamer.play() fails
├─ Recovery:
│  ├─ Check browser audio context state
│  ├─ Resume if suspended
│  ├─ Retry playback
│  └─ Show: "Audio playback issue"
│
└─ Fallback: Display full transcript

MEMORY ERRORS:
├─ Problem: localStorage is full or unavailable
├─ Detection: localStorage.setItem() fails
├─ Recovery:
│  ├─ Log warning
│  ├─ Continue without memory persistence
│  ├─ Memory still works in-session
│  └─ Show: "Some preferences not saved"
│
└─ Note: Conversation continues normally

GEMINI API ERRORS:
├─ Problem: API rate limit or quota exceeded
├─ Detection: 429 / 503 status codes
├─ Recovery:
│  ├─ Exponential backoff
│  ├─ Queue requests
│  ├─ Show user: "Brief pause, please wait"
│  └─ Retry automatically
│
└─ Timeout: 30s max per request

VIDEO AVATAR ERRORS:
├─ Problem: Video files won't load
├─ Detection: video 'error' event
├─ Recovery:
│  ├─ Log error with path
│  ├─ Attempt fallback video
│  ├─ Show: "Avatar animation unavailable"
│  └─ Continue with text/audio only
│
└─ Fallback: Plain colored background

TRANSCRIPT SAVE ERRORS:
├─ Problem: Cannot save to Supabase
├─ Detection: Supabase insert fails
├─ Recovery:
│  ├─ Log full error details
│  ├─ Check: RLS policies, connection, schema
│  ├─ Store in-memory as backup
│  ├─ Show: "Couldn't save transcript"
│  └─ User data not lost (still in memory)
│
└─ Note: Conversation data preserved locally
```

---

## 📊 Performance Considerations

```
┌────────────────────────────────────────────────────────┐
│         PERFORMANCE OPTIMIZATION                       │
└────────────────────────────────────────────────────────┘

AUDIO PROCESSING:
├─ Chunking: 20ms audio frames
├─ Sample rate: 16kHz (optimized)
├─ Format: PCM16 (standard)
├─ Buffering: Waterfall processing
└─ Result: <100ms latency

VIDEO RENDERING:
├─ Two MP4s playing continuously
├─ Chroma key: requestAnimationFrame loop
├─ Canvas caching: Ctx cached for reuse
├─ Opacity transitions: Smooth CSS
└─ Target: 60fps smooth animation

TEXT STREAMING:
├─ Response buffer: Accumulates chunks
├─ Detection: 2s timeout for completion
├─ Display: Real-time in Captions
└─ Rendering: Minimal DOM updates

MEMORY OPERATIONS:
├─ Type: NON_BLOCKING (async)
├─ Storage: localStorage (fast)
├─ No network calls for memory
├─ Silent scheduling
└─ Result: Transparent to user

KEEP-ALIVE MECHANISM:
├─ Interval: 30 seconds
├─ Prevents WebSocket timeout
├─ No visible activity to user
├─ Lightweight ping
└─ Re-establishes if needed

OPTIMIZATION TECHNIQUES:
├─ Tool responses async (non-blocking)
├─ Memory tools silent (no UI overhead)
├─ Canvas context cached
├─ Waterfall audio processing
├─ Lazy loading where possible
└─ Minimal re-renders
```

---

## 🎯 Key Takeaways

1. **Real-time Bidirectional Communication**: User audio → Gemini → Response audio & text
2. **Stateful Memory**: Persistent across sessions, integrated naturally
3. **Tool Calling for Help**: Memory tools and hints extend AI capabilities
4. **Avatar Animation**: MP4 videos with chroma key, state machine controlled
5. **Async Operations**: Memory and hints run non-blocking
6. **Transcript Logging**: Complete conversation history for analysis
7. **Error Resilience**: Graceful degradation on failures
8. **Performance**: Optimized for <100ms latency and smooth 60fps visuals

---

## 📚 File Reference Guide

| Component | File | Responsibility |
|-----------|------|-----------------|
| Main Interface | `MainInterfaceWithAvatar.tsx` | Orchestration, tool handling |
| Context | `LiveAPIContext.tsx` | State management |
| Hook | `use-live-api.ts` | Client initialization, audio |
| Avatar | `VideoExpressBuddyAvatar.tsx` | MP4 rendering, animations |
| Memory | Inline in MainInterface | Memory tools, localStorage |
| Hints | `use-hint-system.ts` | Help system, space bar detection |
| Transcripts | `transcript-service.ts` | Conversation logging |
| Captions | `Captions.tsx` | Text display |
| Types | `types.ts` | TypeScript definitions |

---

**End of Architecture Document**

Generated for ExpressBuddy Live API System
Version: 2024
Last Updated: October 2024
