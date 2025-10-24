# Piko Challenges System Documentation

## 🎯 Overview

Piko Challenges is an interactive learning system where children teach Piko the Panda social skills through guided conversations. Unlike traditional learning where AI teaches the child, **the child becomes the teacher**, reinforcing their own understanding through explanation.

## 🏗️ System Architecture

### Core Components

```
src/
├── components/piko-challenges/
│   ├── PikoChallengeInterface.tsx    # Main interface (copy of MainInterfaceWithVideoAvatar)
│   ├── ChallengeIntroCard.tsx        # Welcome screen with challenge description
│   ├── ChallengeChecklist.tsx        # Floating todo list (top-right)
│   └── ChallengeSuccessDialog.tsx    # Completion celebration
│
├── services/
│   └── challenge-todo-service.ts     # State management for challenge objectives
│
└── public/Backgrounds/restaurant/
    └── restaurant-scene.jpg          # Background image for restaurant challenge
```

### Data Flow

```
Child speaks advice
    ↓
Gemini hears advice & judges if it meets learning objective
    ↓
Gemini calls mark_todo_complete(todoId, true) [NON_BLOCKING]
    ↓
challenge-todo-service updates state
    ↓
Emits 'challenge-todo-updated' event
    ↓
ChallengeChecklist UI updates in real-time
    ↓
When all 5 complete → Show success dialog
```

## 🎮 Level 1: Ordering Food at a Restaurant

### Learning Objectives (5 Todos)

1. **Greet the waiter politely** - Say hello when waiter arrives
2. **Use "please" when ordering** - Add politeness words
3. **Clearly state what food you want** - Articulate order clearly
4. **Say "thank you" after ordering** - Show gratitude
5. **Know how to ask for help if confused** - Feel comfortable asking questions

### Challenge Flow

#### 1. **Intro Card** (on mount)
```tsx
<ChallengeIntroCard
  onStart={handleStartChallenge}
  onLearnMore={handleLearnMore}
/>
```
- Shows mission: "Piko needs your help!"
- Explains Level 1: Coach Mode
- Buttons: [START CHALLENGE] [LEARN MORE]

#### 2. **Active Challenge**
- Background: Restaurant scene
- Piko avatar: Looking confused/nervous
- Checklist visible (top-right)
- Child gives advice → Piko responds with validation
- Todos check off automatically as Piko learns

#### 3. **Success Dialog** (all 5 complete)
```tsx
<ChallengeSuccessDialog
  onContinue={handleContinueToLevel2}
  onRestart={handleRestartChallenge}
/>
```
- Celebration message from Piko
- "Thank you SO much! You taught me exactly what to do!"
- Buttons: [🏆 UNLOCK LEVEL 2] [🔄 Try Again]

## 🔧 Technical Implementation

### 1. Tool Declarations (Non-Blocking like Memory Functions)

```typescript
const challengeFunctions: ExtendedFunctionDeclaration[] = [
  {
    name: "get_todo_status",
    description: "Get current status of all 5 learning objectives",
    parameters: { type: Type.OBJECT, properties: {} },
    behavior: AsyncBehavior.NON_BLOCKING  // ✨ Key: Async execution
  },
  {
    name: "mark_todo_complete",
    description: "Mark objective complete when child teaches it",
    parameters: {
      type: Type.OBJECT,
      properties: {
        todoId: { type: Type.INTEGER, description: "1-5" },
        isCorrect: { type: Type.BOOLEAN, description: "Usually true (be generous)" }
      },
      required: ["todoId", "isCorrect"]
    },
    behavior: AsyncBehavior.NON_BLOCKING  // ✨ Key: Async execution
  }
];
```

### 2. Tool Response Handler (SILENT Scheduling)

```typescript
useEffect(() => {
  const handleToolCall = (toolCall: any) => {
    const functionResponses = toolCall.functionCalls.map((fc: any) => {
      let result;
      
      if (fc.name === 'mark_todo_complete') {
        const response = challengeTodoService.mark_todo_complete(fc.args.todoId, fc.args.isCorrect);
        setTodos(challengeTodoService.get_todo_status());
        
        if (response.allComplete) {
          setTimeout(() => setShowSuccessDialog(true), 2000);
        }
        
        result = { ...response, async_operation: true };
      }
      
      return {
        id: fc.id,
        name: fc.name,
        response: {
          result,
          scheduling: AsyncScheduling.SILENT  // ✨ Key: Background processing
        }
      };
    });
    
    client.sendToolResponse({ functionResponses });
  };
  
  client.on('toolcall', handleToolCall);
}, [client]);
```

### 3. Real-Time UI Updates (Event-Driven)

```typescript
// challenge-todo-service.ts
export function mark_todo_complete(todoId: number, isCorrect: boolean) {
  todo.complete = isCorrect;
  
  // Emit event for UI listeners
  window.dispatchEvent(new CustomEvent('challenge-todo-updated', {
    detail: {
      todoId,
      todo: JSON.parse(JSON.stringify(todo)),
      allTodos: JSON.parse(JSON.stringify(currentTodos)),
      allComplete: currentTodos.every(t => t.complete)
    }
  }));
  
  return { success: true, todo, allComplete };
}
```

```typescript
// ChallengeChecklist.tsx
useEffect(() => {
  const handleTodoUpdate = (event: Event) => {
    const { allTodos } = (event as CustomEvent).detail;
    setLocalTodos(allTodos);  // ✨ Real-time update!
  };
  
  window.addEventListener('challenge-todo-updated', handleTodoUpdate);
  return () => window.removeEventListener('challenge-todo-updated', handleTodoUpdate);
}, []);
```

## 🤖 System Prompt Design

### Core Personality: "Piko Needs Help!"

```
You are Piko, a friendly but NERVOUS panda at a restaurant for the FIRST TIME.
You need help from a child to learn how to order food properly.

PERSONALITY:
- ❓ Confused and Unsure - You don't know restaurant etiquette
- 😰 Nervous - Worried about doing something wrong
- ✅ Validating - Paraphrase child's advice back ("Oh! So I should...")
- 🎓 Scaffolding - Ask follow-up questions to deepen learning
- 💚 Forgiving - Accept any reasonable advice (low-pressure!)
```

### Interaction Pattern

```
1. EXPRESS CONFUSION
   "I'm so nervous! What should I say when the waiter comes over?"

2. LISTEN TO CHILD'S ADVICE
   Child: "You should say what you want to eat"

3. VALIDATE & PARAPHRASE
   "Oh! So I should just say 'I want pizza'? Is that polite enough?"
   [Internally: mark_todo_complete(3, true)]

4. ASK CLARIFYING QUESTIONS
   "Should I say anything BEFORE I tell them what I want?"

5. SHOW GROWTH
   "Ohh good idea! So 'I want pizza, PLEASE'? That's better!"
   [Internally: mark_todo_complete(2, true)]
```

### Tool Usage Guidelines

```typescript
// TODO MAPPING (be generous in judging!)
1. Greet waiter    → Child mentions: greeting, hello, be friendly
2. Say please      → Child mentions: please, polite, magic word, manners
3. State food      → Child mentions: say what you want, tell them food
4. Say thank you   → Child mentions: thank you, thanks, be grateful
5. Ask for help    → Child mentions: ask questions, get help if confused
```

## 📝 Hint System Integration

The hint button prompt should be challenge-specific:

```typescript
const challengeHintPrompt = `
Give the child a gentle hint about teaching Piko restaurant manners.
Focus on what they haven't mentioned yet from:
- Greeting the waiter
- Saying please
- Stating food clearly  
- Saying thank you
- Asking for help if needed

Current progress: ${completedCount}/5 objectives complete

Be encouraging and give ONE specific hint related to an incomplete objective.
`;
```

## 🎨 UI Components

### ChallengeChecklist (Top-Right Floating)

```tsx
<Card className="fixed top-4 right-4 z-50 w-80">
  <CardHeader>
    <CardTitle>🐼 Piko's Learning Goals</CardTitle>
    <Badge>{completedCount}/{totalCount}</Badge>
    <ProgressBar value={completionPercentage} />
  </CardHeader>
  <CardContent>
    {todos.map(todo => (
      <div className={todo.complete ? 'bg-green-50' : 'bg-gray-50'}>
        <Checkbox checked={todo.complete} disabled />
        <label>{todo.text}</label>
        {todo.complete && <span>✅</span>}
      </div>
    ))}
  </CardContent>
</Card>
```

### Success Dialog (Center Overlay)

```tsx
<Card className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="text-7xl animate-bounce">🎉</div>
  <h2>Amazing Job!</h2>
  <p>"Thank you SO much! You taught me exactly what to do!" - Piko</p>
  <Button onClick={onContinue}>🏆 UNLOCK LEVEL 2</Button>
  <Button onClick={onRestart}>🔄 Try Again</Button>
</Card>
```

## 🚀 Adding New Challenges

### 1. Define New Todos

```typescript
// src/services/challenge-todo-service.ts
const GROCERY_SHOPPING_TODOS: ChallengeTodo[] = [
  {
    id: 1,
    text: "Make a shopping list first",
    description: "Teach Piko to write down what he needs",
    complete: false
  },
  // ... more todos
];
```

### 2. Create New Interface Component

```bash
# Copy template
cp src/components/piko-challenges/PikoChallengeInterface.tsx \
   src/components/piko-challenges/GroceryShoppingChallenge.tsx
```

### 3. Update System Prompt

```typescript
const systemPrompt = `
You are Piko at a grocery store for the first time.
You need help learning how to shop for food properly.

LEARNING OBJECTIVES:
1. Make shopping list
2. Find correct aisle
3. Check prices
4. Use shopping cart politely
5. Thank cashier
...
`;
```

### 4. Add Route

```typescript
// App.tsx
<Route path="/piko-challenge/grocery-shopping-level1" element={
  <LiveAPIProvider options={apiOptions}>
    <GroceryShoppingChallenge />
  </LiveAPIProvider>
} />
```

## 🧪 Testing Checklist

- [ ] Intro card displays correctly
- [ ] Challenge starts when clicking "START"
- [ ] Piko acts confused and asks for help
- [ ] When child gives advice, Piko validates it ("Oh! So I should...")
- [ ] Checklist updates in real-time when todo marked complete
- [ ] All 5 todos can be completed
- [ ] Success dialog shows when all complete
- [ ] "Try Again" button resets challenge
- [ ] Background image loads correctly
- [ ] No memory features present
- [ ] Tools use NON_BLOCKING behavior (async)
- [ ] Tool responses use SILENT scheduling

## 📊 Success Metrics

### What Makes This Effective:

1. **Role Reversal** - Child teaches instead of being taught (deeper learning)
2. **Low Pressure** - Very forgiving, can't really fail
3. **Clear Goals** - Visible checklist shows progress
4. **Scaffolding** - Piko asks clarifying questions to deepen thinking
5. **Immediate Feedback** - Checklist updates as child teaches
6. **Celebration** - Success dialog validates child's teaching ability

### Expected Outcomes:

- Child practices articulating social skills
- Reinforces learning through teaching
- Builds confidence in knowledge
- Low-anxiety learning environment
- Clear sense of progress and completion

## 🔗 Integration Points

### With Main ExpressBuddy System:

1. **Route**: `/piko-challenge/restaurant-ordering-level1`
2. **Shared Components**: `VideoExpressBuddyAvatar`, `ControlTray`, `Captions`
3. **Shared Contexts**: `LiveAPIContext` (but NO memory features)
4. **Independent State**: Challenge todos are session-based (localStorage not used)

### Future Expansion:

- Level 2: Practice Mode (Piko tries it, child judges)
- Level 3: Role Play (Child orders, Piko is waiter)
- Level 4: Challenge Mode (Time pressure, menu complications)
- Progress tracking across multiple challenges
- Unlock system for new challenges

## 🎯 Key Differentiators from Main App

| Feature | Main ExpressBuddy | Piko Challenges |
|---------|-------------------|-----------------|
| **Role** | AI teaches child | Child teaches AI |
| **Memory** | Stores conversation history | No memory (session-only) |
| **Pressure** | Low-medium | Very low (can't fail) |
| **Goals** | Open conversation | Specific 5 objectives |
| **Feedback** | Implicit | Explicit (checklist) |
| **Structure** | Free-form | Guided with clear end |
| **Personality** | Confident Piko | Confused/nervous Piko |

## 📚 Resources

- System Prompt: `PikoChallengeInterface.tsx` lines 120-350
- Tool Declarations: `PikoChallengeInterface.tsx` lines 95-118
- Service API: `challenge-todo-service.ts`
- UI Components: `src/components/piko-challenges/`
- Route Config: `App.tsx` line ~170

## 🐛 Troubleshooting

### Checklist not updating
- Check console for 'challenge-todo-updated' events
- Verify `mark_todo_complete` is being called
- Ensure event listeners are registered in `ChallengeChecklist`

### Piko not calling tools
- Check tool declarations include `behavior: AsyncBehavior.NON_BLOCKING`
- Verify system prompt includes tool usage instructions
- Look for tool call logs in console (`🎯 Challenge tool call received`)

### Success dialog not showing
- Check if `allComplete` is true when all 5 todos done
- Verify `response.allComplete` logic in tool handler
- Ensure `setShowSuccessDialog(true)` is being called

### Background not loading
- Verify file exists: `public/Backgrounds/restaurant/restaurant-scene.jpg`
- Check browser console for 404 errors
- Try using absolute URL: `/Backgrounds/restaurant/restaurant-scene.jpg`

---

**Created**: 2025-10-23  
**Version**: 1.0  
**Last Updated**: Initial implementation  
**Author**: Piko Challenge Development Team 🐼
