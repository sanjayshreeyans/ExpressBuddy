# ExpressBuddy Architecture Documentation

## 📚 Documentation Files

This directory contains comprehensive architecture documentation for the ExpressBuddy Live API system. Below is a guide to all available resources.

---

## 📖 Main Documentation Files

### 1. **ARCHITECTURE_DIAGRAM.md** (START HERE)
   - **Length:** 1000+ lines of detailed documentation
   - **Content:**
     - Complete end-to-end system overview with ASCII diagrams
     - Detailed phase-by-phase data flow (9 phases)
     - Avatar state machine with all transitions
     - Video avatar rendering pipeline
     - Memory system architecture (NON_BLOCKING behavior)
     - Tool calling system & help system
     - Audio processing pipeline with interruption handling
     - Complete user journey timeline (T=0s to T=60s+)
     - Component responsibility matrix
     - Detailed memory flow examples
     - Error handling & recovery strategies
     - Performance considerations
     - File reference guide
   
   **Best for:** Understanding the complete system architecture from start to finish

### 2. **ARCHITECTURE_DIAGRAMS_MERMAID.md**
   - **Content:** 15+ Mermaid diagram definitions (text-based)
   - **Includes:**
     - Complete system flow
     - User journey timeline (sequence diagram)
     - Memory system flow
     - Avatar state machine
     - Tool calling lifecycle
     - Audio processing pipeline
     - Connection state diagram
     - Hint/help system flow
     - Video rendering pipeline
     - Error recovery paths
     - Component interactions
     - Data flow summary
     - Performance metrics
   
   **Best for:** Reference definitions for rendering diagrams

### 3. **ARCHITECTURE_QUICK_REFERENCE.md**
   - **Length:** One-page quick lookup guide
   - **Content:**
     - System overview in 5 minutes
     - Key components & responsibilities
     - Step-by-step data flow
     - Tool calling explanation
     - Memory system example
     - Avatar animation states
     - Audio processing technical details
     - Integration points
     - Performance targets
     - Error handling summary
     - File reference map
     - Learning path guide
   
   **Best for:** Quick lookup while developing or debugging

---

## 🖼️ Interactive Visual Diagrams

### **public/architecture/index.html**
   - **Access:** Open in web browser (Chrome, Firefox, Safari, Edge)
   - **Features:**
     - 7 interactive Mermaid diagrams
     - Real-time rendering in browser
     - Responsive design (mobile-friendly)
     - Right-click to save as SVG images
     - Navigation between diagrams
     - Descriptions for each diagram
   
   **Diagrams included:**
   1. System Architecture Overview
   2. Component Architecture
   3. Complete System Data Flow
   4. User Journey Timeline (Sequence)
   5. Memory System Flow
   6. Avatar State Machine
   7. Tool Calling Lifecycle
   8. Audio Processing Pipeline

   **How to open:**
   ```bash
   # Option 1: In Windows Explorer
   # Navigate to: public/architecture/index.html
   # Double-click to open in default browser
   
   # Option 2: Using Python http server
   cd public/architecture
   python -m http.server 8000
   # Then visit: http://localhost:8000
   
   # Option 3: Using npm
   npm start
   # Navigate to http://localhost:3000/architecture/index.html
   ```

---

## 🚀 How to Use These Documents

### For New Team Members (Onboarding)
1. Read **ARCHITECTURE_QUICK_REFERENCE.md** (5 min)
2. View **public/architecture/index.html** diagrams (15 min)
3. Read **ARCHITECTURE_DIAGRAM.md** for deep understanding (1 hour)
4. Study relevant source files mentioned in references

### For Architecture Review
1. Start with **System Architecture Overview** diagram
2. Walk through **User Journey Timeline** sequence diagram
3. Review component interactions diagram
4. Deep-dive into specific systems as needed

### For Development/Debugging
1. Keep **ARCHITECTURE_QUICK_REFERENCE.md** open as reference
2. Use diagrams for specific system understanding
3. Reference **ARCHITECTURE_DIAGRAM.md** for detailed info
4. Use file reference guide to locate code

### For Presentation/Demo
1. Use **public/architecture/index.html** for slides
2. Show interactive diagrams on screen
3. Point to specific flowcharts
4. Reference diagrams in deck

---

## 📋 Key System Components

```
Main Components:
├── MainInterfaceWithAvatar (Orchestration)
├── LiveAPIContext + use-live-api (Connection)
├── VideoExpressBuddyAvatar (Video rendering)
├── TranscriptService (Data logging)
├── Memory System (Context preservation)
└── useHintSystem (Help system)

External Services:
├── Gemini Live API (AI backend)
├── WebRTC Audio (Audio streaming)
├── localStorage (Memory persistence)
└── Supabase (Conversation database)
```

---

## 🎯 System Flow Summary (One Page)

```
USER SPEAKS
    ↓
🎤 Audio captured (16kHz PCM16)
    ↓
📤 Sent to Gemini Live API
    ↓
🤖 Gemini processes + decides if tools needed
    ├─ YES → Execute memory tools (async, NON_BLOCKING)
    └─ NO → Generate response directly
    ↓
📦 Audio & text stream back
    ├─ Audio buffered
    ├─ Text displayed as captions
    ├─ Tools executed asynchronously
    └─ Memory stored to localStorage
    ↓
✅ Audio playback ready
    ├─ Combine audio chunks
    ├─ Start playback to speaker
    └─ Animate avatar (TALKING state)
    ↓
🎭 Avatar animations with MP4 videos
    ├─ Idle animation: Pandaalter1_2.mp4
    ├─ Talking animation: PandaTalkingAnim.mp4
    ├─ Chroma key removes green screen
    └─ 60fps smooth transitions
    ↓
📝 Save transcript to Supabase
    ├─ User transcription
    ├─ AI response
    ├─ Statistics (duration, message count)
    └─ Device information
    ↓
🎭 Avatar returns to IDLE
    └─ Ready for next input
```

---

## 💡 Key Insights

1. **Real-time Bidirectional Communication**
   - Audio flows both directions simultaneously
   - <100ms latency target
   - WebRTC + WebSocket connections

2. **Non-blocking Memory Operations**
   - Memory tools execute asynchronously
   - Don't interrupt conversation flow
   - Silent scheduling and integration
   - Natural memory references

3. **Video Avatar with Smooth Animations**
   - MP4 videos play continuously (never stop)
   - Chroma key removes green screen
   - Canvas blending for smooth transitions
   - requestAnimationFrame for 60fps rendering

4. **Tool Calling System**
   - Gemini decides when to use tools
   - Tools execute asynchronously
   - Results fed back into conversation
   - Enables memory and help functionality

5. **Complete Conversation Recording**
   - Every message captured (user + AI)
   - Statistics calculated
   - Saved to Supabase for analysis
   - Available across sessions

---

## 🔍 Document Navigation

```
Architecture Overview
    ↓
├── Quick Reference (ARCHITECTURE_QUICK_REFERENCE.md)
│   └── Fast lookup, command reference
│
├── Visual Diagrams (public/architecture/index.html)
│   └── Interactive, browser-based
│
└── Detailed Guide (ARCHITECTURE_DIAGRAM.md)
    ├── Complete flows with ASCII diagrams
    ├── Component details
    ├── Integration points
    ├── Error handling
    └── Performance metrics
```

---

## 📞 Key APIs & Interfaces

### Main Context
```typescript
// LiveAPIContext provides:
{
  client: GenAILiveClient;
  connected: boolean;
  volume: number;
  hintSystem: HintSystemState;
  setConfig: (config: LiveConnectConfig) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendHintToGemini: (message: string) => Promise<void>;
  onAITurnStart: (callback: () => void) => void;
  onAITurnComplete: (callback: () => void) => void;
}
```

### Memory Functions (Available to Gemini)
```typescript
// Declared as tools:
write_to_memory(key: string, value: string): void
get_available_memory_keys(): string[]
get_memories_by_keys(keys: string[]): { [key: string]: string }

// All with NON_BLOCKING behavior
```

### Transcript Service
```typescript
TranscriptService.startConversation(sessionId: string): void
TranscriptService.addUserTranscription(text: string): void
TranscriptService.addAITranscription(text: string): void
TranscriptService.endConversationAndSave(): Promise<boolean>
```

---

## 🛠️ Common Tasks

### To understand flow for specific feature:
1. Find feature in ARCHITECTURE_QUICK_REFERENCE.md index
2. View related diagram in public/architecture/index.html
3. Read detailed section in ARCHITECTURE_DIAGRAM.md
4. Look up file reference to find source code

### To modify a component:
1. Find component in file reference guide
2. Understand current role from component matrix
3. Review integration points
4. Make changes following existing patterns
5. Test with appropriate tools

### To add new feature:
1. Decide which component(s) affected
2. Review component responsibilities
3. Check tool calling system if tools needed
4. Update memory tools if storing data
5. Follow existing async patterns

---

## 📊 Statistics

- **Total Documentation:** ~2000 lines
- **Mermaid Diagrams:** 15+ interactive diagrams
- **Components Documented:** 20+
- **Flows Explained:** 10+ complete flows
- **Error Scenarios:** 15+ recovery paths
- **Integration Points:** 25+ mapped

---

## 📖 Learning Path

**Beginner (30 minutes)**
1. Read ARCHITECTURE_QUICK_REFERENCE.md (5 min)
2. View system overview diagram (5 min)
3. View user journey diagram (10 min)
4. View avatar state machine (5 min)
5. View component architecture (5 min)

**Intermediate (1-2 hours)**
1. Read ARCHITECTURE_DIAGRAM.md phases 1-5 (30 min)
2. Study all 7 interactive diagrams (20 min)
3. Review component matrix (10 min)
4. Study specific system of interest (20 min)

**Advanced (2+ hours)**
1. Read complete ARCHITECTURE_DIAGRAM.md (1 hour)
2. Review error handling & recovery (15 min)
3. Study performance considerations (15 min)
4. Deep-dive into source files (30+ min)

---

## 🎓 Resources

- **ARCHITECTURE_DIAGRAM.md** - Main reference guide
- **ARCHITECTURE_DIAGRAMS_MERMAID.md** - Diagram definitions
- **ARCHITECTURE_QUICK_REFERENCE.md** - Quick lookup
- **public/architecture/index.html** - Interactive diagrams
- **Source Code** - See file reference guide

---

## 📞 Questions?

Refer to:
- ARCHITECTURE_QUICK_REFERENCE.md for quick answers
- ARCHITECTURE_DIAGRAM.md for detailed explanations
- Component matrix for responsibility questions
- Integration points for "how does X talk to Y"
- Error handling section for failure scenarios

---

**Last Updated:** October 2024
**Version:** 1.0
**Status:** Complete & Comprehensive

For the latest updates, check the source documentation files.
