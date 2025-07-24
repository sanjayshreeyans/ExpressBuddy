# Implementation Plan

- [x] 1. Set up project structure and install dependencies





  - Install face-api.js library for emotion detection
  - Create directory structure for emotion detective components. this is an existing project so make sure you integrate properly
  - Set up TypeScript interfaces and types
  - _Requirements: All requirements depend on proper setup_

- [x] 2. Create face images service and data management






  - [x] 2.1 Create face images service to load and manage human face images


    - Implement service to parse face image filenames (###_age_gender_emotion_variant.jpg)
    - Create functions to filter faces by emotion, age, gender
    - Add face image caching and preloading functionality
    - _Requirements: 2.2, 5.3, 5.4_

  - [x] 2.2 Implement emotion configuration and mapping system


    - Create emotion metadata with descriptions and scenarios
    - Implement face-api.js emotion mapping for complex emotions
    - Add question template system for different question types
    - _Requirements: 5.1, 5.2, 5.5_

- [x] 3. Set up database schema and Supabase integration




  - [x] 3.1 Create database migration for emotion detective tables





    - Add emotion_detective_progress table for child progress tracking
    - Add emotion_detective_sessions table for session management
    - Add emotion_attempts table for individual question attempts
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 3.2 Implement Supabase service methods for emotion detective


    - Create methods to save/load child progress
    - Implement session creation and completion tracking
    - Add XP calculation and level progression logic
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [x] 4. Create TTS service with browser TTS and WebSocket viseme integration




  - [x] 4.1 Implement browser TTS service with viseme WebSocket integration


    - Create service to use browser speechSynthesis API
    - Integrate with existing VisemeTranscriptionService WebSocket
    - Implement audio recording and streaming to WebSocket for lip-sync
    - Add subtitle generation and timing synchronization. alot of it is already done check how it is curretnly working. C:\Users\Sanjay Shreeyans J\Downloads\ExpressBuddy\live-api-web-console\src\components\avatar\RealtimeExpressBuddyAvatar.tsx
    - _Requirements: 2.1, 6.1, 6.4_

  - [x] 4.2 Create TTS playback controller for Pico avatar


    - Integrate with existing VisemePlaybackController
    - Add methods to speak text with lip-sync animation
    - Implement speaker icon functionality for re-reading text. alot of it is alredy done both have to play in sync check the C:\Users\Sanjay Shreeyans J\Downloads\ExpressBuddy\live-api-web-console\src\components\avatar\RealtimeExpressBuddyAvatar.tsx
    - Add error handling for TTS failures
    - _Requirements: 2.1, 6.1, 6.4_

- [x] 5. Implement face-api.js emotion detection service




  - [x] 5.1 Set up face-api.js models and initialization



    - Load face detection and expression recognition models
    - Create service to initialize face-api.js with proper models
    - Implement model loading progress tracking


    - Add error handling for model loading failures
    - _Requirements: 3.4, 3.5, 6.6_



  - [ ] 5.2 Create emotion detection and analysis functions


    - Implement real-time face detection from camera stream
    - Add emotion expression analysis with confidence scoring
    - Create emotion matching logic against target emotions
    - Add face detection overlay and guidance system
    - After finished make sure you make a demo componeent screen but it on app.tsx and we can try out that componeent. 
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 6. Create main emotion detective learning container component




  - [x] 6.1 Build EmotionDetectiveLearning main container using shadcn/ui


    - Create main component with lesson state management
    - Implement phase transitions (intro → questions → mirroring → complete)
    - Add progress tracking and XP calculation
    - Use shadcn/ui Card, Progress, and Badge components
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.4, 4.5_

  - [x] 6.2 Implement lesson introduction component with Pico TTS


    - Create LessonIntroduction component with center-to-left Pico transition
    - Integrate edge TTS service for lesson narration, we arleady have this done
    - Use Framer Motion for smooth Pico positioning animations
    - _Requirements: 2.1, 6.1, 6.3_

- [x] 7. Build question type components using shadcn/ui





  - [x] 7.1 Create QuestionType1 component (Face → Emotion)


    - Display human face image with multiple choice emotion options
    - Use shadcn/ui Card, Button, and AspectRatio components
    - Implement immediate TTS narration and speaker icons
    - Add answer validation and feedback system
    - _Requirements: 2.2, 2.3, 2.4, 6.1, 6.2_

  - [x] 7.2 Create QuestionType2 component (Emotion → Face)

    - Display 2x2 grid of face images for emotion selection
    - Use shadcn/ui Card and AspectRatio for face display
    - Implement TTS for emotion description (no speaker icons)
    - Add visual selection feedback and validation
    - _Requirements: 2.6, 6.1, 6.2_

  - [x] 7.3 Create QuestionType3 component (Scenario → Face)

    - Display scenario text with 2x2 face image grid
    - Use shadcn/ui Card, Typography, and AspectRatio components
    - Implement TTS for scenario reading with speaker icon
    - Add scenario-to-emotion matching logic
    - _Requirements: 2.7, 6.1, 6.2_

  - [x] 7.4 Create QuestionType4 component (Face → Scenario)

    - Display face image with multiple scenario text options
    - Use shadcn/ui Card, Button, and Typography components
    - Implement TTS for question and scenario options with speaker icons
    - Add face-to-scenario matching validation
    - _Requirements: 2.8, 6.1, 6.2_

- [x] 8. Implement camera-based emotion mirroring component




  - [x] 8.1 Create EmotionMirroring component with camera integration


    - Implement WebRTC camera access and preview. already done. EmotionDetectionDemo.tsx
    - Use shadcn/ui Card, Button, and Progress components
    - Add reference face image display alongside camera
    - the reference image is the right answer (FACE only) in the preious question. basically this is a extension to the preivous question. 
    - We already created most of the code for this use case EmotionDetectionDemo.tsx
    - In there all the camera, the detection the rendering the processing is mostly done. 
    - Create capture button and image processing workflow
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 8.2 Integrate face-api.js emotion detection in mirroring


    - Add real-time face detection overlay on camera preview
    - Implement emotion analysis on captured images
    - Create confidence scoring and matching logic
    - Add retry mechanism for low-confidence results
    - Use shadcn/ui Progress for confidence display
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [x] 9. Create progress tracking and XP system





  - [x] 9.1 Implement XP calculation and display system


    - Create XP calculation logic for different achievements
    - Use shadcn/ui Badge and Progress for XP display
    - Add animated XP counters with Framer Motion
    - Duolingo style graphics
    - Implement session completion bonus calculation
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 9.2 Create lesson completion screen


    - Build completion screen with total XP earned display
    - Use shadcn/ui Card, Badge, and Button components
    - Add celebration animations and achievement feedback
    - Implement navigation back to learning path
    - _Requirements: 4.3, 4.4, 6.5_
-

- [x] 10. Add error handling and accessibility features




  - [x] 10.1 Implement comprehensive error handling


    - Add camera access error handling with shadcn/ui Alert components
    - Create face-api.js model loading error recovery
    - Implement TTS and WebSocket connection error handling
    - Add graceful degradation for unsupported browsers
    - _Requirements: 6.4, 6.6_

  - [x] 10.2 Add accessibility features and keyboard navigation


    - Implement keyboard navigation for all interactive elements
    - Add ARIA labels and screen reader support
    - Create high contrast mode support
    - Add reduced motion preferences handling
    - _Requirements: 6.2, 6.3_

- [-] 11. Integration testing and route setup


  - [x] 11.1 Integrate emotion detective into existing learning path









    - Add route for emotion detective lessons in App.tsx
    - Update LearningPathHome to include emotion detective lessons
    - Test integration with existing authentication and progress systems
    - Very important till now we made everything in separate pieces like the edgetts and pico avatar, the question systems were seperate, and the emotion detection. now you have to integrate all these pieces together to one emotion detection mode. remeber the goal and we load into the screen and we have pico on the left and we have questions. have proper ui if you get a question wrong or right and once an answer is correct make them replicate the expression screen. then continue with the question. then once 10 questions . do the lesson componeent ui. and make sure you update the database. I have also allowed write acess to the supabase with your mcp incase you wanted to qurery or do something. run lint after all changes and fix all problems.
    - _Requirements: 1.1, 1.2, 1.3, 1.4_