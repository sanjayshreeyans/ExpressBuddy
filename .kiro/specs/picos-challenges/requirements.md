# Requirements Document

## Introduction

Pico's Challenges is a conflict resolution learning feature that teaches children essential social skills through conversational scenarios with the Pico avatar. This feature is essentially a clone of the existing /chat functionality, using the same Google Live Speech system, RealtimeExpressBuddyAvatar, and conversation infrastructure, but with different system prompts and scenario-specific narration for each conflict resolution challenge. 

## Requirements

### Requirement 1: Chat-Based Conflict Scenario System

**User Story:** As a child, I want to have conversations with Pico about different problems so that I can learn how to handle similar situations in real life.

#### Acceptance Criteria

1. WHEN the system starts a conflict resolution session THEN it SHALL use the existing /chat infrastructure with specialized system prompts for conflict scenarios
2. WHEN a scenario begins THEN Pico SHALL initiate conversation using a predefined system prompt that sets up the conflict situation
3. WHEN presenting a scenario THEN Pico SHALL speak naturally using the Google Live Speech system, exactly like the /chat functionality
4. WHEN a child responds THEN the system SHALL process their speech input and continue the conversation based on the conflict resolution system prompt
5. WHEN providing guidance THEN Pico SHALL use conversational responses rather than multiple choice options, maintaining natural dialogue flow

### Requirement 2: Personal Problems System Prompts (Level 1)

**User Story:** As a child, I want to have conversations with Pico about personal problems so that I can learn problem-solving strategies for my own challenges.

#### Acceptance Criteria

1. WHEN Level 1 is accessed THEN the system SHALL use specialized system prompts that make Pico present personal problems like: dropped food situations, feeling sad/lonely, losing items, being scared, and feeling frustrated with tasks
2. WHEN Pico presents a personal problem THEN the system prompt SHALL instruct Pico to display appropriate emotional expressions and speak about the problem naturally
3. WHEN a child responds THEN the system prompt SHALL guide Pico to encourage positive self-help strategies through natural conversation
4. WHEN a child suggests a helpful response THEN the system prompt SHALL make Pico show relief/happiness and explain why the solution works through dialogue
5. WHEN a child suggests an unhelpful response THEN the system prompt SHALL guide Pico to gently redirect toward better options through conversational guidance

### Requirement 3: Interpersonal Conflicts System Prompts (Level 2)

**User Story:** As a child, I want to have conversations with Pico about conflicts with friends so that I can learn how to handle disagreements and social problems.

#### Acceptance Criteria

1. WHEN Level 2 is unlocked THEN the system SHALL use specialized system prompts for interpersonal conflict scenarios including: toy sharing disputes, friendship problems, playground conflicts, sibling disagreements, and group activity challenges
2. WHEN Pico describes an interpersonal conflict THEN the system prompt SHALL instruct Pico to show appropriate emotions and naturally mention the other person involved in the conflict through conversation
3. WHEN a child responds THEN the system prompt SHALL guide Pico to encourage appropriate social language through natural dialogue, modeling phrases like "Can I please have my turn?", "Let's take turns", "That makes me feel sad when...", and "How can we solve this together?"
4. WHEN a child suggests a good social response THEN the system prompt SHALL make Pico demonstrate the positive outcome and explain how it helps relationships through conversational feedback
5. WHEN a child suggests a poor social response THEN the system prompt SHALL guide Pico to show the negative consequence and offer alternative approaches through natural dialogue

### Requirement 4: Avatar Integration and Live Speech System

**User Story:** As a child, I want Pico to speak naturally with realistic lip-sync and respond to my voice so that the conversation feels real and engaging.

#### Acceptance Criteria

1. WHEN presenting any scenario THEN Pico SHALL use the existing RealtimeExpressBuddyAvatar with Google Live Speech integration for natural conversation flow
2. WHEN Pico speaks THEN the system SHALL use the Google Live Speech system with real-time visemes and lip-sync, similar to the /chat functionality
3. WHEN waiting for child responses THEN the system SHALL use silence detection to know when the child has finished speaking or needs prompting
4. WHEN a scenario involves strong emotions THEN Pico SHALL demonstrate the emotion through facial expressions and body language using the Rive animation system with live speech visemes
5. WHEN providing feedback THEN Pico SHALL use the live speech system to deliver natural, conversational responses with appropriate emotional transitions

### Requirement 5: Progress Tracking and Skill Development

**User Story:** As a child, I want to see my progress in helping Pico and unlock new challenges so that I stay motivated to learn conflict resolution skills.

#### Acceptance Criteria

1. WHEN a child completes a scenario successfully THEN the system SHALL award XP points using the existing reward system (10 XP for correct responses, 20 XP for completing scenarios)
2. WHEN a child completes multiple scenarios THEN the system SHALL track their conflict resolution skill development across different categories (personal problems, sharing, communication, empathy)
3. WHEN sufficient XP is earned THEN the system SHALL unlock new scenario types and difficulty levels
4. WHEN a session is completed THEN the system SHALL provide a summary showing scenarios completed, skills practiced, and total XP earned
5. WHEN progress is made THEN the system SHALL save advancement using the existing session management infrastructure

### Requirement 6: Age-Appropriate Content and Language

**User Story:** As a parent, I want the conflict scenarios to be appropriate for my child's age and development level so that they can learn effectively without being overwhelmed.

#### Acceptance Criteria

1. WHEN scenarios are presented THEN they SHALL use simple, clear language appropriate for children ages 4-10
2. WHEN conflicts are described THEN they SHALL focus on common childhood situations that children can relate to and practice
3. WHEN response options are provided THEN they SHALL model language that children can realistically use in their daily interactions
4. WHEN feedback is given THEN it SHALL be encouraging and educational rather than judgmental or critical
5. WHEN emotional content is presented THEN it SHALL be handled sensitively with focus on positive coping strategies and resolution

### Requirement 7: Reusability and Integration

**User Story:** As a developer, I want the conflict resolution system to integrate seamlessly with existing components so that development is efficient and the user experience is consistent.

#### Acceptance Criteria

1. WHEN implementing the feature THEN it SHALL reuse the existing RealtimeExpressBuddyAvatar component without modifications
2. WHEN implementing speech functionality THEN it SHALL use the Google Live Speech system with visemes and silence detection, similar to the /chat implementation.
3. WHEN implementing progress tracking THEN it SHALL extend the existing session management and XP reward systems
4. WHEN implementing the user interface THEN it SHALL follow the existing design patterns and accessibility standards from the emotion detective system
5. WHEN integrating with the database THEN it SHALL extend the existing Supabase schema with new tables for conflict scenarios and progress tracking