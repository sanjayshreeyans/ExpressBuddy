# Requirements Document

## Introduction

The Emotion Detective feature is a core learning module within a Duolingo-style educational platform that teaches children to identify and express emotions through interactive gameplay. The feature uses real human face images for emotion recognition, camera-based mirroring, and face-api.js powered feedback to create an engaging learning experience. Children progress through levels with various emotion recognition activities using a database of naturalistic facial expressions. The system uses Pico, an animated avatar voice agent with lip-syncing capabilities, as the primary guide and narrator throughout the learning journey.

## Requirements

### Requirement 1

**User Story:** As a child learner, I want to see a progress map showing my learning journey, so that I can track my advancement through different emotion detection levels.

#### Acceptance Criteria

1. WHEN the child opens the main dashboard THEN the system SHALL display a Duolingo-style progress map with 3 distinct learning paths
2. WHEN the child views the progress map THEN the system SHALL show completed levels, current level, and locked future levels with visual indicators
3. WHEN the child completes a level THEN the system SHALL unlock the next level in the progression path
4. IF the child has not started any lessons THEN the system SHALL highlight the first available lesson as the entry point

### Requirement 2

**User Story:** As a child learner, I want to participate in guided emotion identification lessons using real human faces, so that I can learn to recognize different facial expressions and emotions.

#### Acceptance Criteria

1. WHEN a lesson begins THEN Pico SHALL appear at the left side of the screen and provide narration with lip-synced TTS and subtitles
2. WHEN the lesson presents Question Type 1 THEN the system SHALL display a human face image from the Faces directory and ask "What emotion is this?"
3. WHEN Question Type 1 is displayed THEN the system SHALL provide 4 multiple-choice emotion options for the child to select
4. WHEN the child selects an emotion THEN the system SHALL evaluate the response against the correct emotion
5. WHEN the child provides the correct emotion identification THEN the system SHALL proceed to the camera mirroring phase
6. WHEN Question Type 2 is presented THEN the system SHALL describe an emotion and display 4 different human face images for selection
7. WHEN Question Type 3 is presented THEN the system SHALL describe a scenario (e.g., "My mom was mad at me today") and display 4 emotion faces for selection
8. WHEN Question Type 4 is presented THEN the system SHALL display a human face showing an emotion and provide 4 scenario options to choose from

### Requirement 3

**User Story:** As a child learner, I want to mirror emotions using my camera, so that I can practice expressing the emotions I've learned to identify.

#### Acceptance Criteria

1. WHEN the child correctly answers any question type THEN the system SHALL activate the camera mirroring UI
2. WHEN the camera activates THEN the system SHALL display the target emotion as a reference image on the right side
3. WHEN the child attempts to mirror the emotion THEN the system SHALL capture their facial expression
4. WHEN the expression is captured THEN the system SHALL use face-api.js to analyze the emotion displayed
5. WHEN face-api.js processes the image THEN the system SHALL compare the detected emotion with the target emotion
6. IF the mirrored emotion is incorrect THEN the system SHALL provide feedback and allow the child to try again
7. WHEN the mirrored emotion is verified as correct THEN Pico SHALL provide positive feedback through lip-synced TTS. FOR VERSION ONE JUST USE BROWSER TTS AND REQUEST LIPSYNC FROM OUR WEBSOCKET. SEARCH THROUGH THE CURRENT IMPLEMENTION ON HOW IT WORKS AND HOW DO YOU SEND THE AUDIO AND HOW THE LIPSYNC STUFF IS RECIEVED AND HOW TO PLAY IT BACK.  THERE ARE EXISTING CLASSES AND METHODS THAT HANDLE THE VISME PLAYBACK AND EVERYHTING YOUR GOAL IS TO REUSE THEM. WHEN A QUESTION LOADS IMMEDIATLEY MAKE PICO SAY THE QUESTION. THEN NEXT TO EACH CARD OF THE MULITIPLE CHOICE HAVE LIKE A SPEAKER ICON WHICH WILL BE CLICKED TO MAKE PICO SAY READ THAT QUESTION. THATS ONLY WHEN WE HAVE TEXT OPTIONS NOT WHEN WE HAVE FACES. 

### Requirement 4

**User Story:** As a child learner, I want to earn XP and see my progress, so that I feel motivated to continue learning and can track my achievements.

#### Acceptance Criteria

1. WHEN the child correctly identifies an emotion THEN the system SHALL award XP points
2. WHEN the child successfully mirrors an emotion THEN the system SHALL award additional XP points
3. WHEN the child completes 10 emotion challenges THEN the system SHALL consider it a complete session
4. WHEN a session is completed THEN the system SHALL display a lesson complete screen with total XP earned
5. WHEN XP is awarded THEN the system SHALL update the child's overall progress and level advancement

### Requirement 5

**User Story:** As a child learner, I want to progress through different types of emotion recognition challenges, so that I can gradually build my emotional intelligence skills.

#### Acceptance Criteria

1. WHEN starting Level 1 THEN the system SHALL present only basic emotions (happy, sad, angry, neutral)
2. WHEN the child demonstrates mastery of basic emotions THEN the system SHALL unlock more complex emotions (disgust, fear)
3. WHEN presenting human face images THEN the system SHALL use appropriate files from the Faces directory (format: ###_age_gender_emotion_variant)
4. WHEN selecting face images THEN the system SHALL ensure appropriate age and gender diversity across challenges
5. IF the child struggles with current level emotions THEN the system SHALL provide additional practice opportunities before progression

### Requirement 6

**User Story:** As a child learner, I want clear visual and audio feedback throughout the experience, so that I understand my progress and know what actions to take next.

#### Acceptance Criteria

1. WHEN Pico speaks THEN the system SHALL display subtitles at the bottom of the screen with lip-synced animation
2. WHEN the child interacts with UI elements THEN the system SHALL provide immediate visual feedback
3. WHEN transitions occur between lesson phases THEN the system SHALL use smooth animations to guide the child's attention
4. WHEN errors occur THEN the system SHALL provide encouraging, child-friendly error messages
5. WHEN achievements are unlocked THEN the system SHALL celebrate with appropriate visual and audio feedback
6. WHEN implementing face-api.js THEN the system SHALL properly initialize face detection, expression recognition, and provide real-time feedback
