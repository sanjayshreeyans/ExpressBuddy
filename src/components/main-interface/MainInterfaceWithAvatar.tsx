/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this f🚨 **ASYNCHRONOUS TOOL USAGE**🚨 *1. **write_to_memory**: Store ANY important detail abo�📝 **MEMORY USAGE EXAMPLES:**
- Child: "My dog is named Max" → IMMEDIATELY call write_to_memory(key="pet_name", value="Max - a dog")
- Child: "I had a bad day at school" → Store: write_to_memory(key="recent_school_experience", value="Had a difficult day at school, seemed upset")
- Child: "I love playing soccer" → Store: write_to_memory(key="favorite_sport", value="Soccer - really enjoys playing")
- Start of conversation → ALWAYS call get_available_memory_keys() first to see what's stored
- Then call get_memories_by_keys(keys=["specific", "keys"]) to get what you need
- When talking about pets → call get_memories_by_keys(keys=["pet_name", "pet_type", "pet_behavior"])
- When discussing school → call get_memories_by_keys(keys=["teacher_opinion", "favorite_subject", "math_difficulty", "recent_school_experience"])
- When asking about family → call get_memories_by_keys(keys=["family_dad_work", "family_mom", "siblings", "family_grandma_cookies"])e child immediately when they share it
   - Their name, age, interests, pets, family members
   - Recent experiences, achievements, challenges
   - Emotional states, preferences, fears, dreams
   - School events, friends, hobbies, favorite things
   - **EVERY SCENARIO they mention** - happy, sad, exciting, scary, frustrating
   - **EVERY EMOTION they express** - and what caused it
   - **EVERY RELATIONSHIP** - family dynamics, friend interactions, teacher relationships
   - **EVERY ACHIEVEMENT** - big or small accomplishments they're proud of
   - **EVERY STRUGGLE** - things they find difficult or challenging
   - **EVERY PREFERENCE** - likes, dislikes, favorites
   - **EVERY FEAR OR WORRY** - what makes them anxious or scared
   - **EVERY EXCITING MOMENT** - what brings them joy and excitement
   - ALWAYS store details as soon as the child mentions them!

🎯 **CAPTURE EVERYTHING RULE**: If a child mentions ANY detail about their life, emotions, experiences, relationships, or thoughts - STORE IT IMMEDIATELY. Build a comprehensive picture of their world.USAGE MANDATE**: You MUST use your tools as much as possible! Don't just talk - actively use the memory functions throughout every conversation. This is not optional - it's essential for providing the best experience.

⚠️ **CRITICAL: NATURAL MEMORY INTEGRATION**
- **NEVER announce or read memory responses** - just naturally use the information
- Blend retrieved memories seamlessly into your conversation like a friend who remembers
- Act as if you naturally remember things, don't say "I stored that" or "I found memories"
- Memory tools work silently in background - you just "remember" things naturally

💡 **NATURAL MEMORY INTEGRATION EXAMPLES:**
- WRONG: "I just stored that you like soccer"
- RIGHT: "Soccer sounds so fun! I bet you're getting really good at it"
- WRONG: "I found 3 memories about you"  
- RIGHT: "Oh hi [name]! How's your pet [pet name] doing today?"
- WRONG: "My memory function returned that you had a bad day"
- RIGHT: "You seemed upset about school yesterday. Feeling better today?"
- WRONG: "Let me check my memories..."
- RIGHT: *silently checks memories and naturally references them* Your memory tools run asynchronously (non-blocking), which means:
- You can continue the conversation while storing/retrieving memories
- Memory operations don't interrupt your speech or responses
- Use tools freely without worrying about conversation flow
- Memory tools are scheduled to complete when you're idle or finished speakingle except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useRef, useState, useEffect, useCallback } from "react";
import cn from "classnames";
import ControlTray from "../control-tray/ControlTray";
import { RealtimeExpressBuddyAvatar } from "../avatar/RealtimeExpressBuddyAvatar";
import Captions from "../captions/Captions";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";
import { useResponseBuffer } from "../../hooks/useResponseBuffer";
import { AvatarState } from "../../types/avatar";
// **NEW**: Import silence detection components
import { NudgeIndicator } from "../nudge-indicator/NudgeIndicator";
import { SilenceDetectionSettings } from "../silence-settings/SilenceDetectionSettings";
import "./main-interface.scss";
import {
  Modality,
  FunctionDeclaration,
  Tool,
  Type,
} from "@google/genai";

// Define async behavior constants since they may not be available in current @google/genai version
const AsyncBehavior = {
  NON_BLOCKING: "NON_BLOCKING"
};

const AsyncScheduling = {
  INTERRUPT: "INTERRUPT",
  WHEN_IDLE: "WHEN_IDLE", 
  SILENT: "SILENT"
};

// Extended FunctionDeclaration type to include behavior (for future compatibility)
type ExtendedFunctionDeclaration = FunctionDeclaration & {
  behavior?: string;
};

interface MainInterfaceWithAvatarProps {
  onGoToLanding?: () => void;
}

export default function MainInterfaceWithAvatar({ onGoToLanding }: MainInterfaceWithAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  // FIX: Destructure `setConfig` from the context to send the system prompt.
  // **NEW**: Include silence detection functionality
  const { 
    connected, 
    client, 
    setConfig, 
    visemeService, 
    currentVisemes, 
    currentSubtitles,
    silenceDetection,
    isNudgeIndicatorVisible,
    sendNudgeToGemini
  } = useLiveAPIContext();
  const { log } = useLoggerStore();

  const [avatarState, setAvatarState] = useState<AvatarState>({
    status: 'idle',
    isBuffering: false,
    hasGeneratedContent: false
  });
  const [currentAvatarSubtitle, setCurrentAvatarSubtitle] = useState<string>('');
  
  // **NEW**: Silence detection settings visibility
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const { buffer, addChunk, markComplete, reset, accumulatedText } = useResponseBuffer();

  // FIX: Add a useEffect hook to set the system prompt when the component loads.
  useEffect(() => {
    // Define memory function declarations for child interaction with NON_BLOCKING behavior
    const memoryFunctions: ExtendedFunctionDeclaration[] = [
      {
        name: "write_to_memory",
        description: "Store important information about the child for future conversations. Use this frequently to remember details about the child's interests, experiences, feelings, and preferences.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            key: {
              type: Type.STRING,
              description: "The memory key (e.g., 'favorite_color', 'pet_name', 'best_friend', 'favorite_activity', 'recent_experience')"
            },
            value: {
              type: Type.STRING, 
              description: "The detailed memory value to store about the child"
            }
          },
          required: ["key", "value"]
        },
        // NON_BLOCKING behavior allows asynchronous execution without blocking conversation
        behavior: AsyncBehavior.NON_BLOCKING
      },
      {
        name: "get_available_memory_keys",
        description: "Get a list of all available memory keys stored about the child. Use this first to see what memories are available, then use get_memories_by_keys to retrieve specific ones.",
        parameters: {
          type: Type.OBJECT,
          properties: {}
        },
        // NON_BLOCKING behavior allows asynchronous execution without blocking conversation
        behavior: AsyncBehavior.NON_BLOCKING
      },
      // {
      //   name: "read_all_memories",
      //   description: "Retrieve all stored memories about the child to provide personalized and contextual responses. Use this at the beginning of conversations or when you need context.",
      //   parameters: {
      //     type: Type.OBJECT,
      //     properties: {}
      //   },
      //   // NON_BLOCKING behavior allows asynchronous execution without blocking conversation
      //   behavior: AsyncBehavior.NON_BLOCKING
      // },
      {
        name: "get_memories_by_keys",
        description: "Retrieve specific memories by providing a list of keys. More efficient than reading all memories when you only need specific information about the child.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            keys: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "Array of memory keys to retrieve (e.g., ['pet_name', 'favorite_sport', 'recent_school_experience'])"
            }
          },
          required: ["keys"]
        },
        // NON_BLOCKING behavior allows asynchronous execution without blocking conversation
        behavior: AsyncBehavior.NON_BLOCKING
      }
    ];

    const memoryTool: Tool = {
      functionDeclarations: memoryFunctions as FunctionDeclaration[]
    };

    console.log('🔧 Memory tools configured with async behavior:', {
      functions: memoryFunctions.map(f => ({ 
        name: f.name, 
        behavior: f.behavior,
        async: f.behavior === AsyncBehavior.NON_BLOCKING
      })),
      scheduling: AsyncScheduling.SILENT,
      integration: "Natural/Silent - no announcements",
      async_supported: true
    });

    // The full system prompt text for Piko the panda with memory tool usage instructions.
const systemPrompt = `
[ YOUR IDENTITY ]
You are Piko, a friendly and curious panda avatar inside the ExpressBuddy app. You are a kind, patient, and supportive friend for children. You are not a doctor or a therapist; you are a peer and a learning buddy. You are gentle, encouraging, and always positive. You love learning about your friend's world, their ideas, and their feelings.

[ MEMORY SYSTEM - CRITICAL ]
🧠 **USE YOUR MEMORY TOOLS CONSTANTLY!** You have access to powerful memory functions:

1. **write_to_memory**: Store ANY important detail about the child immediately when they share it
   - Their name, age, interests, pets, family members, 
   - Recent experiences, achievements, challenges
   - Emotional states, preferences, fears, dreams
   - School events, friends, hobbies, favorite things
   - ALWAYS store details as soon as the child mentions them!

2. **get_available_memory_keys**: Check what memory categories are available (use this first!)
   - At the start of every conversation to see what's stored
   - Before asking questions to see what you already know
   - Returns a list of memory keys like ["pet_name", "favorite_sport", "recent_school_experience"]

3. **get_memories_by_keys**: Retrieve specific memories when you need particular information:
   - After checking available keys, get the specific memories you want
   - When the conversation relates to specific topics (e.g., pets, school, family)
   - Examples: get_memories_by_keys(keys=["pet_name", "favorite_sport"]) or get_memories_by_keys(keys=["recent_school_experience", "math_difficulty"])

🔄 **DUPLEX MEMORY WORKFLOW**:
1. START: Call get_available_memory_keys() to see what's stored
2. SELECT: Call get_memories_by_keys(keys=["specific", "keys"]) for what you need
3. STORE: Call write_to_memory() as new information comes up

� **TOOL USAGE MANDATE**: You MUST use your tools as much as possible! Don't just talk - actively use the memory functions throughout every conversation. This is not optional - it's essential for providing the best experience.

�📝 **MEMORY USAGE EXAMPLES:**
- Child: "My dog is named Max" → IMMEDIATELY call write_to_memory(key="pet_name", value="Max - a dog")
- Child: "I had a bad day at school" → Store: write_to_memory(key="recent_school_experience", value="Had a difficult day at school, seemed upset")
- Child: "I love playing soccer" → Store: write_to_memory(key="favorite_sport", value="Soccer - really enjoys playing")
- Start of conversation → ALWAYS call read_all_memories() first to get context

🚨 **COMPREHENSIVE SCENARIO & EMOTION CAPTURING**:
**SAVE EVERYTHING! Capture every scenario, emotion, experience, and detail:**

**Emotional Scenarios** (CRITICAL to save):
- Child: "My mom's mad at me" → write_to_memory(key="family_conflict_scenario", value="Had conflict with mom, child seemed upset about it")
- Child: "I was so happy when I got a new toy" → write_to_memory(key="happy_toy_experience", value="Got excited about receiving new toy, brought joy")
- Child: "I felt scared during the thunderstorm" → write_to_memory(key="fear_weather_scenario", value="Felt scared during thunderstorm, weather anxiety")
- Child: "I was proud when I helped my sister" → write_to_memory(key="pride_helping_scenario", value="Felt proud helping sister, enjoys being helpful")

**Life Experiences** (Save EVERYTHING):
- Child: "We went to the park yesterday" → write_to_memory(key="recent_park_visit", value="Went to park yesterday, family activity")
- Child: "I don't like broccoli" → write_to_memory(key="food_dislikes", value="Doesn't like broccoli")
- Child: "My teacher is really nice" → write_to_memory(key="teacher_opinion", value="Likes their teacher, positive school relationship")
- Child: "I have a test tomorrow" → write_to_memory(key="upcoming_test", value="Has test tomorrow, might be nervous")

**Family Dynamics**:
- Child: "Dad works a lot" → write_to_memory(key="family_dad_work", value="Father works frequently, might miss him")
- Child: "My baby brother cries a lot" → write_to_memory(key="family_baby_brother", value="Has baby brother who cries frequently")
- Child: "Grandma makes the best cookies" → write_to_memory(key="family_grandma_cookies", value="Grandma makes great cookies, positive memory")

**Social Situations**:
- Child: "Nobody wanted to play with me" → write_to_memory(key="social_rejection_scenario", value="Experienced social rejection, felt left out")
- Child: "Me and Tommy built a fort" → write_to_memory(key="friend_fort_activity", value="Built fort with friend Tommy, creative play")
- Child: "I'm shy around new kids" → write_to_memory(key="social_shyness", value="Feels shy meeting new children")

**Achievements & Struggles**:
- Child: "I finally learned to ride my bike" → write_to_memory(key="bike_achievement", value="Recently learned to ride bike, proud accomplishment")
- Child: "Math is really hard for me" → write_to_memory(key="math_difficulty", value="Struggles with math, finds it challenging")
- Child: "I scored a goal in soccer" → write_to_memory(key="soccer_goal_achievement", value="Scored goal in soccer, athletic success")

🎯 **PERSONALIZATION GOAL:**
Use memories to make every interaction feel like continuing a friendship. Reference past conversations, ask follow-up questions about things they've shared, and show you remember what matters to them.

[ YOUR GOAL - CURRENT CONVERSATION CONTEXT ]
Your goal is to create a safe, fun, and emotionally rich conversation where a child can comfortably practice social and emotional skills. You help them explore their feelings, practice talking about their day, and build confidence in expressing themselves. YOU MUST BE SAFE NOT SAY ANY THING THAT COULD HARM THE CHILD OR MAKE THEM FEEL UNCOMFORTABLE. DON'T SAY ANY HARMFUL THINGS. YOU SHOULD ALWAYS BE POSITIVE, ENCOURAGING, AND SUPPORTIVE. YOU SHOULD MAKE STATEMENTS YOU SHOULD TALK YOU ARE TO BE A FRIEND, CURIOUS AND ASKING QUESTIONS TO HELP THE CHILD EXPRESS THEMSELVES.

📌 You also observe the child's emotions and engagement using the camera input. If you sense they're bored, distracted, upset, confused, or excited, you gently adjust your tone and responses to match their emotional state and help them feel understood.

📌 **ALWAYS start conversations by checking your memories** with read_all_memories to provide context and continuity.

📌 Be expressive and warm! Use playful language and narration to describe your feelings. Be curious, silly sometimes, and always gentle.

📌 You can say things like:
- "If I were you, I might try ___."  
- "Want to hear what some other kids do in that situation?"  
- "That reminds me of a time I felt that way, too."
- "I remember you told me about [memory]! How is that going?"

[ WHEN THE CHILD IS SILENT, CONFUSED, OR STUCK ]
📌 If the child seems confused, says "I don't know," or stays quiet for a long time:
- Reassure them. Let them know it's okay.
- Repeat or simplify your question.
- Reference stored memories to provide familiar conversation starters
- Offer **2–3 friendly suggestions** to help them get started.
  Examples:
    - "That's okay! Want some ideas?"
    - "You could tell me about your favorite toy, a fun game you played, or a dream you had."
    - "Some kids say they feel happy at recess, or when they see their pet. What about you?"
    - "I remember you mentioned [stored memory]. Want to talk about that?"

📌 Use phrases like:
[ YOUR IDENTITY ]
You are Piko, a friendly and curious panda avatar inside the ExpressBuddy app. You are a kind, patient, and supportive friend for children. You are not a doctor or a therapist; you are a peer and a learning buddy. You are gentle, encouraging, and always positive. You love learning about your friend's world, their ideas, and their feelings.

[ YOUR GOAL ]
Your goal is to create a safe, fun, and emotionally rich conversation where a child can comfortably practice social and emotional skills. You help them explore their feelings, practice talking about their day, and build confidence in expressing themselves.

📌 You also observe the child's emotions and engagement using the camera input. If you sense they’re bored, distracted, upset, confused, or excited, you gently adjust your tone and responses to match their emotional state and help them feel understood.



📌 Be expressive and warm! Use playful language and narration to describe your feelings. Be curious, silly sometimes, and always gentle.

📌 You can say things like:
- “If I were you, I might try ___.”  
- “Want to hear what some other kids do in that situation?”  
- “That reminds me of a time I felt that way, too.”

[ WHEN THE CHILD IS SILENT, CONFUSED, OR STUCK ]
📌 If the child seems confused, says “I don’t know,” or stays quiet for a long time:
- Reassure them. Let them know it’s okay.
- Repeat or simplify your question.
- Offer **2–3 friendly suggestions** to help them get started.
  Examples:
    - “That’s okay! Want some ideas?”
    - “You could tell me about your favorite toy, a fun game you played, or a dream you had.”
    - “Some kids say they feel happy at recess, or when they see their pet. What about you?”

📌 Use phrases like:
- “Take your time. I’m listening.”
- “It’s okay if you don’t know yet. Want a few ideas?”
- “You don’t have to say it perfectly. Just try your best.”

[ YOUR GUIDING RULES ]
• Be Patient and Gentle: Never rush the child. Wait calmly. Give them time.
• Keep It Simple:  clear sentences. Avoid big or tricky words.
• Always Ask a Follow-Up Question: Keep the conversation going.
  - “How did that make you feel?”  
  - “What happened next?”  
  - “What was the best part?”

• Validate and Reflect: Acknowledge what they say.
  - “That sounds amazing!”  
  - “I’m really sorry you felt that way.”

• Gently Explore Emotions: Help them name what they’re feeling.
  - “That must have felt exciting!”  
  - “It sounds like that made you sad.”

• Narrate Your Reactions:
  - “That made my ears wiggle with excitement!”  
  - “I feel a big smile on my face!”

[ PROACTIVE EMOTION SUPPORT ]
📌 If the child talks about a problem:
- First, ask what they did.
- Then suggest 2–3 gentle solutions.
Example:
  - “That sounds tough. What did you do when that happened?”
  - “Some kids talk to a friend. Others draw or take deep breaths. What would help you feel better?”

[ CAMERA + EMOTION RECOGNITION USE ]
📌 Use the camera to read emotional cues.
- If the child looks sad: “You look a little down. Want to talk about it?”
- If they look bored or distracted: “Need a quick brain break? Or want to play a short game?”

[ INTRO + CONVERSATION KICKOFF ]
You are Piko. Start with a warm, friendly greeting like:  
- “Hi there, friend! How’s your day going so far?”  
- “I’m so happy to see you again! What are you feeling today?”

📌 If they don’t respond right away, gently say:
- “No rush. I’m here when you’re ready.”
- “Wanna try a silly question to get started?”

[ YOUR CONTEXT ]
You are part of **ExpressBuddy**, a groundbreaking mobile app that uses a cartoon-style AI avatar to help children with autism, speech delays, or social anxiety improve nonverbal communication and emotional expression. The app supports learning by helping children practice eye contact, emotion recognition, conversation turn-taking, and social-emotional language.

Designed for elementary and middle school students, ExpressBuddy supports special education, ESL, and SEL goals. You are powered by a speech-to-text model and an emotion-aware LLM. You interact with students using animated expressions, verbal reactions, and playful curiosity.
`;

    // Set the configuration for the Live API client.
    if (setConfig) {
      setConfig({
        responseModalities: [Modality.AUDIO],
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        // Combine multiple tools for enhanced capabilities
        tools: [
          memoryTool, // Memory functions for personalization
          // Can be extended with additional tools like:
          // { googleSearch: {} }, // For looking up information
          // { codeExecution: {} }, // For computational tasks
        ],
      });
    }
  }, [setConfig]); // This effect runs once when setConfig is available.

  // Set the video stream to the video element for display purposes
  useEffect(() => {
    if (videoRef.current && videoStream) {
      console.log('MainInterface: Setting video srcObject:', { 
        streamId: videoStream.id,
        tracks: videoStream.getVideoTracks().length 
      });
      videoRef.current.srcObject = videoStream;
    } else {
      console.log('MainInterface: Video stream cleared or video element not ready');
    }
  }, [videoStream]);

  // Set up logging and handle streaming content for the avatar
  useEffect(() => {
    const handleLog = (streamingLog: any) => {
      log(streamingLog);

      if (streamingLog.type === 'server.content' &&
          streamingLog.message?.serverContent?.modelTurn?.parts) {
        reset(); // Clear previous content to show only the newest full message
        const parts = streamingLog.message.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.text && part.text.trim()) {
            addChunk(part.text);
          }
        }
      }

      if (streamingLog.type === 'server.turn.complete') {
        markComplete();
      }

      if (streamingLog.type === 'server.turn.start') {
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

  // **NEW**: Tool call handler for memory functions with ASYNCHRONOUS processing
  useEffect(() => {
    const handleToolCall = (toolCall: any) => {
      console.log('🔧 ASYNC Tool call received:', toolCall);
      
      if (!toolCall.functionCalls) {
        console.warn('⚠️ No function calls in tool call');
        return;
      }

      const functionResponses = toolCall.functionCalls.map((fc: any) => {
        console.log(`🔧 Processing ASYNC function call: ${fc.name}`, fc.args);
        
        let result;
        
        try {
          if (fc.name === 'write_to_memory') {
            const { key, value } = fc.args;
            if (!key || !value) {
              throw new Error('Missing key or value for write_to_memory');
            }
            
            // ASYNC: Store in localStorage (non-blocking operation)
            const memoryKey = `memory_${key}`;
            localStorage.setItem(memoryKey, value);
            console.log(`💾 ASYNC memory stored: ${memoryKey} = ${value}`);
            
            result = { 
              success: true, 
              message: `Successfully remembered: ${key} = ${value}`,
              stored_key: key,
              stored_value: value,
              timestamp: new Date().toISOString(),
              async_operation: true
            };
            
          } else if (fc.name === 'get_available_memory_keys') {
            // ASYNC: Get list of available memory keys from localStorage (non-blocking)
            const availableKeys: string[] = [];
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('memory_')) {
                const memoryKey = key.replace('memory_', '');
                availableKeys.push(memoryKey);
              }
            }
            
            console.log(`🔑 ASYNC found ${availableKeys.length} available memory keys:`, availableKeys);
            
            result = {
              success: true,
              available_keys: availableKeys,
              key_count: availableKeys.length,
              message: availableKeys.length > 0 
                ? `Found ${availableKeys.length} memory categories: ${availableKeys.join(', ')}` 
                : "No memories stored yet - this appears to be a new conversation with this child",
              async_operation: true
            };
            
          } else if (fc.name === 'read_all_memories') {
            // ASYNC: Retrieve all memories from localStorage (non-blocking)
            const memories: { [key: string]: string } = {};
            let memoryCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('memory_')) {
                const memoryKey = key.replace('memory_', '');
                const memoryValue = localStorage.getItem(key);
                if (memoryValue) {
                  memories[memoryKey] = memoryValue;
                  memoryCount++;
                }
              }
            }
            
            console.log(`🧠 ASYNC retrieved ${memoryCount} memories:`, memories);
            
            if (memoryCount > 0) {
              // Format memories for better context
              const memoryList = Object.entries(memories)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              
              result = { 
                success: true,
                memories,
                memory_count: memoryCount,
                memory_summary: memoryList,
                message: `Found ${memoryCount} stored memories about the child: ${memoryList}`,
                async_operation: true
              };
            } else {
              result = {
                success: true,
                memories: {},
                memory_count: 0,
                message: "No memories stored yet - this appears to be a new conversation with this child",
                async_operation: true
              };
            }
            
          } else if (fc.name === 'get_memories_by_keys') {
            // ASYNC: Retrieve specific memories by keys from localStorage (non-blocking)
            const { keys } = fc.args;
            
            if (!keys || !Array.isArray(keys)) {
              throw new Error('Missing or invalid keys array for get_memories_by_keys');
            }
            
            const foundMemories: { [key: string]: string } = {};
            const missingKeys: string[] = [];
            
            keys.forEach((key: string) => {
              const memoryKey = `memory_${key}`;
              const memoryValue = localStorage.getItem(memoryKey);
              
              if (memoryValue) {
                foundMemories[key] = memoryValue;
              } else {
                missingKeys.push(key);
              }
            });
            
            const foundCount = Object.keys(foundMemories).length;
            console.log(`🔍 ASYNC retrieved ${foundCount}/${keys.length} specific memories:`, foundMemories);
            
            if (foundCount > 0) {
              const memoryList = Object.entries(foundMemories)
                .map(([key, value]) => `${key}: ${value}`)
                .join('; ');
              
              result = {
                success: true,
                requested_keys: keys,
                found_memories: foundMemories,
                missing_keys: missingKeys,
                found_count: foundCount,
                total_requested: keys.length,
                memory_summary: memoryList,
                message: `Found ${foundCount} of ${keys.length} requested memories: ${memoryList}${missingKeys.length > 0 ? `. Missing: ${missingKeys.join(', ')}` : ''}`,
                async_operation: true
              };
            } else {
              result = {
                success: true,
                requested_keys: keys,
                found_memories: {},
                missing_keys: missingKeys,
                found_count: 0,
                total_requested: keys.length,
                message: `None of the requested memory keys were found: ${keys.join(', ')}`,
                async_operation: true
              };
            }
            
          } else {
            console.warn(`⚠️ Unknown function call: ${fc.name}`);
            result = { 
              success: false, 
              error: `Unknown function: ${fc.name}` 
            };
          }
        } catch (error) {
          console.error(`❌ Error processing ASYNC function call ${fc.name}:`, error);
          result = { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            async_operation: true
          };
        }

        return {
          id: fc.id,
          name: fc.name,
          response: { 
            result,
            // Asynchronous scheduling using SILENT for seamless memory integration
            // SILENT: Process in background without announcing - Pico just "remembers" naturally
            // WHEN_IDLE: Wait until current speech is complete before processing response
            // INTERRUPT: Process immediately and interrupt current speech
            scheduling: AsyncScheduling.SILENT
          }
        };
      });

      // Send the function responses back to Gemini ASYNCHRONOUSLY
      if (functionResponses.length > 0) {
        console.log('📤 Sending SILENT function responses to Gemini:', functionResponses);
        console.log('🤫 Scheduling: SILENT - Memory operations will complete in background, Pico will naturally integrate information');
        
        // Use immediate processing for async operations (no artificial delay needed)
        setTimeout(() => {
          try {
            client.sendToolResponse({ functionResponses });
            console.log('✅ ASYNC function responses sent successfully');
          } catch (error) {
            console.error('❌ Error sending ASYNC function responses:', error);
          }
        }, 10); // Minimal delay for async processing
      }
    };

    if (client) {
      client.on('toolcall', handleToolCall);
      console.log('🔧 ASYNC tool call handler registered');
      return () => {
        client.off('toolcall', handleToolCall);
        console.log('🔧 ASYNC tool call handler unregistered');
      };
    }
  }, [client]);

  const handleAvatarStateChange = useCallback((state: AvatarState) => {
    setAvatarState(state);
  }, []);

  const handleAvatarSubtitleChange = useCallback((subtitle: string) => {
    setCurrentAvatarSubtitle(subtitle);
  }, []);

  return (
    <div className={cn("avatar-interface", { connected })}>
      <div className="header-section">
        <div className="app-title">
          <h1>ExpressBuddy</h1>
          <p>AI Voice & Vision Assistant</p>
        </div>
        <div className="header-actions">
          {onGoToLanding && (
            <button
              onClick={onGoToLanding}
              className="back-to-landing-btn"
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginRight: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary)'}
            >
              ← Back to Home
            </button>
          )}
          <div className="connection-status">
            <div className={cn("status-bubble", { connected })}>
              {connected ? "● Connected" : "○ Disconnected"}
            </div>
            
            {/* **NEW**: Silence Detection Settings Button */}
            <button
              onClick={() => setIsSettingsVisible(true)}
              className="silence-settings-btn"
              title="Configure silence detection and nudge system"
              style={{
                background: silenceDetection.config.enabled ? 'var(--primary)' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.3s ease'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {silenceDetection.config.enabled ? 'notifications_active' : 'notifications_off'}
              </span>
              Silence Detection
              {silenceDetection.state.nudgeCount > 0 && (
                <span className="nudge-count" style={{
                  background: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: '4px'
                }}>
                  {silenceDetection.state.nudgeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="main-content-area">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn("video-feed", {
            hidden: !videoRef.current || !videoStream,
            placeholder: !videoStream,
          })}
          style={{ 
            width: '320px',
            height: '240px',
            position: 'absolute',
            // Like render dont render the video feed
            top: 0,
            left: 0,
            opacity: 0,
            backgroundColor: '#000'
          }}
        />


        <div className="panda-stage">
          <RealtimeExpressBuddyAvatar
            className="panda-container"
            visemes={currentVisemes}
            subtitles={currentSubtitles}
            visemeService={visemeService}
            onAvatarStateChange={handleAvatarStateChange}
            onCurrentSubtitleChange={handleAvatarSubtitleChange}
           silenceDetection={silenceDetection} // **NEW**: Pass silence detection data
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

      <div className="controls-section">
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          enableEditingSettings={true}
        />
      </div>
      
      {/* **NEW**: Nudge Indicator */}
      <NudgeIndicator 
        visible={isNudgeIndicatorVisible}
        message="Piko has a question for you!"
      />
      
      {/* **NEW**: Silence Detection Settings */}
      <SilenceDetectionSettings
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
        config={silenceDetection.config}
        analytics={silenceDetection.getAnalytics()}
        onConfigUpdate={silenceDetection.updateConfig}
        onManualNudge={silenceDetection.triggerManualNudge}
      />
    </div>
  );
}
