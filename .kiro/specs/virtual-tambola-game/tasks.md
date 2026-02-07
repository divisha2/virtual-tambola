# Implementation Plan: Virtual Tambola Game Platform

## Overview

This implementation plan breaks down the Virtual Tambola game platform into discrete coding tasks. The system will be built using JavaScript (Node.js for backend, React.js for frontend) with Socket.IO for real-time communication and Firebase Firestore for data persistence. Each task builds incrementally, ensuring core functionality is validated early through testing.

## Tasks

- [x] 1. Initialize project structure and dependencies
  - Create monorepo structure with separate frontend and backend directories
  - Initialize Node.js projects with package.json for both frontend and backend
  - Install core dependencies: React, Express, Socket.IO, Firebase Admin SDK, Tailwind CSS, Framer Motion
  - Set up Firebase project and configure Firestore
  - Create environment configuration files for Firebase credentials
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement backend core services and data models
  - [x] 2.1 Create Room Management Service
    - Implement room code generation with "TMB-XXXX" format
    - Implement room creation, validation, and lifecycle management
    - Create Firestore schema for rooms collection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 2.2 Write property tests for Room Management Service
    - **Property 1: Room Code Generation Format and Uniqueness**
    - **Property 3: Room Code Validity Lifecycle**
    - **Property 4: Case-Insensitive Room Code Resolution**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**
  
  - [ ]* 2.3 Write unit tests for Room Management Service
    - Test room creation with valid/invalid host names
    - Test room code collision handling
    - Test room status transitions
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 3. Implement Ticket Generator Service
  - [x] 3.1 Create ticket generation algorithm
    - Implement 3×9 grid generation with 15 numbers
    - Implement column-based number distribution (1-9, 10-19, etc.)
    - Implement uniqueness validation within room
    - Create Firestore schema for tickets collection
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 3.2 Write property tests for Ticket Generator
    - **Property 9: Ticket Structure Invariant**
    - **Property 10: Ticket Number Range Constraint**
    - **Property 11: Ticket Uniqueness Within Room**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 3.3 Write unit tests for Ticket Generator
    - Test edge cases for ticket generation
    - Test column number distribution
    - Test ticket assignment on room creation and join
    - _Requirements: 3.1, 3.2, 3.4, 3.5_


- [x] 4. Implement Prize Configuration Service
  - [x] 4.1 Create prize configuration logic
    - Implement prize type validation (Early Five, Top Row, Middle Row, Bottom Row, Full House)
    - Implement frequency assignment and tracking
    - Implement configuration locking on game start
    - Implement prize availability checking
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 4.2 Write property tests for Prize Configuration Service
    - **Property 5: Prize Type Validation**
    - **Property 6: Prize Frequency Validation**
    - **Property 7: Prize Configuration Lock on Game Start**
    - **Property 8: Prize Availability Tracking**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  
  - [ ]* 4.3 Write unit tests for Prize Configuration Service
    - Test prize configuration before and after game start
    - Test frequency decrement on claim approval
    - Test prize unavailability scenarios
    - _Requirements: 2.3, 2.4, 2.5_

- [x] 5. Implement Game State Manager
  - [x] 5.1 Create number calling system
    - Implement random number selection from remaining pool
    - Implement called numbers tracking (no duplicates)
    - Implement current number and history management
    - Implement automatic number marking on tickets
    - _Requirements: 4.2, 4.3, 4.5, 3.6_
  
  - [ ]* 5.2 Write property tests for Game State Manager
    - **Property 14: Number Selection from Remaining Pool**
    - **Property 15: No Duplicate Number Calls**
    - **Property 17: Current Number and History Tracking**
    - **Property 13: Automatic Number Marking on Tickets**
    - **Validates: Requirements 4.2, 4.3, 4.5, 3.6**
  
  - [ ]* 5.3 Write unit tests for Game State Manager
    - Test number calling sequence
    - Test history tracking with edge cases (0, 1, 2+ numbers)
    - Test ticket marking logic
    - _Requirements: 4.2, 4.3, 4.5_

- [x] 6. Checkpoint - Backend core services complete
  - Ensure all backend service tests pass
  - Verify Firestore schema is properly configured
  - Ask the user if questions arise

- [x] 7. Implement Claim Verification Service
  - [x] 7.1 Create claim submission and validation logic
    - Implement claim queue with timestamp ordering
    - Implement claim validation logic (Early Five, rows, Full House)
    - Implement claim approval/rejection handling
    - Create Firestore schema for claims collection
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6, 6.7, 10.1_
  
  - [ ]* 7.2 Write property tests for Claim Verification Service
    - **Property 19: Claim Data Completeness**
    - **Property 20: Prize Frequency Decrement on Approval**
    - **Property 32: Claim Queue Ordering**
    - **Property 33: Pending Claim Rejection on Prize Exhaustion**
    - **Validates: Requirements 6.2, 6.3, 6.4, 10.1, 10.3**
  
  - [ ]* 7.3 Write unit tests for Claim Verification Service
    - Test claim validation for each prize type
    - Test invalid claim scenarios
    - Test concurrent claim handling
    - _Requirements: 6.1, 6.2, 6.4, 10.1_

- [x] 8. Implement Socket.IO event handlers
  - [x] 8.1 Create server-side Socket.IO event handlers
    - Implement room creation and join events
    - Implement game start event
    - Implement number call event with broadcast
    - Implement claim submission and verification events
    - Implement disconnect/reconnect handling
    - _Requirements: 4.4, 6.2, 6.5, 6.6, 7.4, 7.5, 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 8.2 Write property tests for Socket.IO handlers
    - **Property 16: Number Broadcast to All Participants**
    - **Property 21: Winner Announcement Broadcast**
    - **Property 22: Rejection Notification to Claimant**
    - **Property 24: Real-Time State Synchronization**
    - **Property 25: Room-Scoped Event Isolation**
    - **Validates: Requirements 4.4, 6.5, 6.6, 7.4, 7.5**
  
  - [ ]* 8.3 Write integration tests for Socket.IO events
    - Test end-to-end event flow from client to server to broadcast
    - Test room isolation (events don't leak between rooms)
    - Test reconnection scenarios
    - _Requirements: 7.4, 7.5, 9.2, 9.4_

- [x] 9. Implement connection resilience logic
  - [x] 9.1 Create disconnect/reconnect handling
    - Implement state persistence on participant disconnect
    - Implement state restoration on reconnect
    - Implement game pause on host disconnect
    - Implement game resume on host reconnect
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 9.2 Write property tests for connection resilience
    - **Property 28: State Persistence on Participant Disconnect**
    - **Property 29: State Restoration on Participant Reconnect**
    - **Property 30: Game Pause on Host Disconnect**
    - **Property 31: Game Resume on Host Reconnect**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**

- [x] 10. Checkpoint - Backend complete
  - Ensure all backend tests pass
  - Verify Socket.IO events work correctly
  - Test with Socket.IO client manually
  - Ask the user if questions arise

- [x] 11. Initialize frontend React application
  - [x] 11.1 Set up React project with Vite
    - Initialize React app with Vite
    - Configure Tailwind CSS
    - Install Framer Motion
    - Install Socket.IO client
    - Set up routing (React Router)
    - Create design system with CSS variables for art-directed theme
    - _Requirements: 11.1, 11.2_
  
  - [x] 11.2 Create base layout and theme
    - Implement bold, expressive typography (avoid generic fonts)
    - Implement high-contrast color palette with CSS variables
    - Add texture/noise/grid backgrounds
    - Set up Framer Motion animation utilities
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 12. Implement Landing/Join Room component
  - [x] 12.1 Create landing page UI
    - Build room creation form (host name input, create button)
    - Build room join form (room code input, participant name input, join button)
    - Implement form validation
    - Connect to Socket.IO backend
    - _Requirements: 1.1, 1.3, 1.5_
  
  - [ ]* 12.2 Write unit tests for Landing component
    - Test form validation
    - Test room creation flow
    - Test room join flow
    - Test error handling (invalid room code, game started)
    - _Requirements: 1.3, 1.5, 8.2_

- [x] 13. Implement Host Dashboard component
  - [x] 13.1 Create host dashboard UI
    - Build prize configuration panel
    - Build number board (1-90 grid with visual states)
    - Build participant list display
    - Build "Start Game" and "Next Number" buttons
    - Implement Socket.IO event listeners for real-time updates
    - _Requirements: 2.1, 2.2, 4.1, 4.2_
  
  - [x] 13.2 Implement prize configuration functionality
    - Connect prize configuration to backend
    - Disable configuration after game start
    - Display prize availability status
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 13.3 Implement number calling functionality
    - Connect "Next Number" button to backend
    - Update number board visual states in real-time
    - Display current number prominently
    - _Requirements: 4.2, 4.3, 4.5_
  
  - [ ]* 13.4 Write unit tests for Host Dashboard
    - Test prize configuration UI
    - Test number board rendering
    - Test Socket.IO event handling
    - _Requirements: 2.1, 4.2_

- [x] 14. Implement Claim Verification Panel component
  - [x] 14.1 Create claim verification UI
    - Build claim notification system
    - Build claim details modal (participant name, ticket snapshot, prize type, timestamp)
    - Build approve/reject buttons
    - Connect to Socket.IO backend for claim events
    - _Requirements: 6.3, 6.4, 6.6, 10.4_
  
  - [ ]* 14.2 Write unit tests for Claim Verification Panel
    - Test claim display
    - Test approve/reject actions
    - Test claim queue handling
    - _Requirements: 6.3, 6.4, 6.6_

- [x] 15. Implement Participant Game View component
  - [x] 15.1 Create participant game UI
    - Build ticket display (3×9 grid)
    - Build current number display (prominent)
    - Build number history display (previous 2 numbers)
    - Build claim button (always enabled)
    - Implement automatic number highlighting on ticket
    - Connect to Socket.IO backend for real-time updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 3.6_
  
  - [x] 15.2 Implement claim submission functionality
    - Build prize selection modal
    - Connect claim submission to backend
    - Display claim status (pending, approved, rejected)
    - _Requirements: 6.1, 6.2, 6.6_
  
  - [ ]* 15.3 Write unit tests for Participant Game View
    - Test ticket rendering
    - Test number highlighting
    - Test claim submission flow
    - Test real-time updates
    - _Requirements: 3.6, 5.4, 6.1, 6.2_

- [x] 16. Implement Winner Announcement Overlay component
  - [x] 16.1 Create winner announcement UI
    - Build animated overlay with Framer Motion
    - Display winner name and prize type
    - Implement auto-dismiss after delay
    - _Requirements: 6.5_
  
  - [ ]* 16.2 Write unit tests for Winner Announcement
    - Test announcement display
    - Test animation triggers
    - Test auto-dismiss
    - _Requirements: 6.5_

- [x] 17. Implement room access control
  - [x] 17.1 Add join validation logic
    - Check game status before allowing join
    - Display appropriate error messages
    - Prevent joins after game start
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ]* 17.2 Write property tests for room access control
    - **Property 26: Join Attempt Validation Against Game Status**
    - **Property 27: Room State Transition on Game Start**
    - **Validates: Requirements 8.1, 8.2, 8.4**

- [x] 18. Checkpoint - Frontend core complete
  - Ensure all frontend tests pass
  - Test UI components manually
  - Verify Socket.IO connection works
  - Ask the user if questions arise

- [x] 19. Implement error handling and edge cases
  - [x] 19.1 Add client-side error handling
    - Implement network error handling with reconnection
    - Add connection status indicator
    - Implement input validation error messages
    - Add loading states for async operations
    - _Requirements: All requirements_
  
  - [x] 19.2 Add server-side error handling
    - Implement error logging
    - Add retry logic for Firestore operations
    - Handle concurrent modification conflicts
    - Validate all incoming Socket.IO events
    - _Requirements: All requirements_
  
  - [ ]* 19.3 Write unit tests for error scenarios
    - Test network failure handling
    - Test invalid input handling
    - Test database error scenarios
    - _Requirements: All requirements_

- [x] 20. Implement remaining property tests
  - [ ]* 20.1 Write property test for display name validation
    - **Property 2: Display Name Validation**
    - **Validates: Requirements 1.3**
  
  - [ ]* 20.2 Write property test for ticket assignment
    - **Property 12: Automatic Ticket Assignment on Join**
    - **Validates: Requirements 3.5, 8.3**
  
  - [ ]* 20.3 Write property test for previous numbers availability
    - **Property 18: Previous Numbers Availability**
    - **Validates: Requirements 5.4**
  
  - [ ]* 20.4 Write property test for game continuation after rejection
    - **Property 23: Game Continuation After Rejection**
    - **Validates: Requirements 6.7**

- [x] 21. Integration and end-to-end testing
  - [ ]* 21.1 Write end-to-end tests
    - Test complete game flow: create room → join → configure prizes → start → call numbers → claim → verify
    - Test multiple participants in same room
    - Test host disconnect and reconnect
    - Test participant disconnect and reconnect
    - _Requirements: All requirements_
  
  - [x] 21.2 Manual testing and polish
    - Test with multiple browser windows
    - Verify real-time synchronization
    - Test on different devices
    - Verify art-directed design implementation

- [x] 22. Final checkpoint - Complete system
  - Ensure all tests pass (unit, property, integration)
  - Verify all 33 correctness properties are implemented
  - Test complete game flows manually
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All code should follow the art-directed design principles (bold typography, high contrast, textured backgrounds, purposeful motion)
