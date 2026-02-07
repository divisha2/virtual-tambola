# Requirements Document

## Introduction

Virtual Tambola is a real-time multiplayer game platform that enables hosts to create and manage Tambola (Housie/Bingo) games with participants joining remotely. The system emphasizes host control, trust-based verification, real-time synchronization, and a distinctive art-directed visual identity that avoids generic AI-generated aesthetics.

## Glossary

- **Tambola_System**: The complete virtual Tambola game platform
- **Host**: The user who creates and manages a game room
- **Participant**: A user who joins an existing game room
- **Room**: A game session instance with a unique code
- **Ticket**: A 3×9 grid containing 15 unique numbers (1-90) for Tambola gameplay
- **Prize**: A winning condition (Early Five, Top Row, Middle Row, Bottom Row, Full House)
- **Claim**: A participant's assertion that they have achieved a prize condition
- **Number_Call**: The action of revealing the next random number in the game sequence

## Requirements

### Requirement 1: Room Creation and Management

**User Story:** As a host, I want to create a game room with a unique shareable code, so that participants can easily join my Tambola game.

#### Acceptance Criteria

1. WHEN a host initiates room creation, THE Tambola_System SHALL generate a unique alphanumeric room code in the format "TMB-XXXX"
2. WHEN a room code is generated, THE Tambola_System SHALL ensure the code is unique across all active game sessions
3. WHEN a host enters their display name, THE Tambola_System SHALL accept alphanumeric names between 2 and 30 characters
4. WHEN a room is created, THE Tambola_System SHALL assign the room code a validity period limited to one active game session
5. WHEN processing room codes for joining, THE Tambola_System SHALL treat codes as case-insensitive

### Requirement 2: Prize Configuration System

**User Story:** As a host, I want to configure prize types and winner frequencies before starting the game, so that I can customize the game experience for my participants.

#### Acceptance Criteria

1. WHEN a host configures prizes before game start, THE Tambola_System SHALL allow selection from the predefined prize types: Early Five, Top Row, Middle Row, Bottom Row, and Full House
2. WHEN a host assigns frequency to a prize, THE Tambola_System SHALL accept positive integer values representing maximum number of winners
3. WHEN the game starts, THE Tambola_System SHALL lock prize configuration to prevent modifications during gameplay
4. WHEN a prize reaches its configured frequency limit, THE Tambola_System SHALL mark that prize as unavailable for further claims
5. IF a host attempts to modify prize configuration after game start, THEN THE Tambola_System SHALL reject the modification and maintain existing configuration

### Requirement 3: Ticket Generation and Assignment

**User Story:** As a participant, I want to receive a unique Tambola ticket when I join a room, so that I can play the game fairly.

#### Acceptance Criteria

1. WHEN a ticket is generated, THE Tambola_System SHALL create a 3-row by 9-column grid containing exactly 15 numbers
2. WHEN populating ticket numbers, THE Tambola_System SHALL use only numbers from the range 1 to 90 inclusive
3. WHEN generating tickets for a room, THE Tambola_System SHALL ensure each ticket is unique within that room
4. WHEN a host creates a room, THE Tambola_System SHALL automatically generate and assign one ticket to the host
5. WHEN a participant joins a room, THE Tambola_System SHALL automatically generate and assign one unique ticket to that participant
6. WHEN a number is called during gameplay, THE Tambola_System SHALL automatically mark that number on all tickets containing it

### Requirement 4: Number Calling System

**User Story:** As a host, I want to call numbers randomly one at a time, so that I can control the pace of the game.

#### Acceptance Criteria

1. WHEN the host views the game board, THE Tambola_System SHALL display a grid of numbers 1 through 90 with visual states for not-called, called, and current number
2. WHEN the host triggers "Next Number", THE Tambola_System SHALL select a random number from the remaining uncalled numbers
3. WHEN a number is called, THE Tambola_System SHALL ensure that number cannot be called again in the same game session
4. WHEN the host calls a number, THE Tambola_System SHALL broadcast that number to all participants in real-time
5. WHEN a number is called, THE Tambola_System SHALL designate it as the current number and move the previous current number to the history

### Requirement 5: Participant Gameplay Interface

**User Story:** As a participant, I want to see my ticket with called numbers highlighted and track the current number, so that I can follow the game and identify when I have a winning condition.

#### Acceptance Criteria

1. WHEN a participant views their game interface, THE Tambola_System SHALL display their assigned Tambola ticket with all 15 numbers
2. WHEN a number is called that appears on a participant's ticket, THE Tambola_System SHALL automatically highlight that number on the ticket
3. WHEN displaying game state to participants, THE Tambola_System SHALL show the current called number prominently
4. WHEN displaying game state to participants, THE Tambola_System SHALL show the previous two called numbers in a secondary display area
5. WHEN a participant views their interface, THE Tambola_System SHALL provide an enabled claim button at all times

### Requirement 6: Claim Submission and Verification

**User Story:** As a participant, I want to claim a prize when I achieve a winning condition, so that the host can verify and award my win.

#### Acceptance Criteria

1. WHEN a participant clicks the claim button, THE Tambola_System SHALL prompt the participant to select a prize category
2. WHEN a participant submits a claim, THE Tambola_System SHALL send the claim with participant name, ticket snapshot, and claimed prize to the host
3. WHEN the host receives a claim, THE Tambola_System SHALL display the participant's name, complete ticket snapshot, and claimed prize type
4. WHEN the host approves a claim, THE Tambola_System SHALL decrement the prize frequency count for that prize type
5. WHEN the host approves a claim, THE Tambola_System SHALL broadcast a winner announcement to all participants in the room
6. WHEN the host rejects a claim, THE Tambola_System SHALL notify the participant of the rejection
7. WHEN the host rejects a claim, THE Tambola_System SHALL allow the game to continue without interruption

### Requirement 7: Real-Time Synchronization

**User Story:** As a user, I want all game events to update instantly across all connected clients, so that everyone has a consistent view of the game state.

#### Acceptance Criteria

1. WHEN a number is called, THE Tambola_System SHALL propagate the update to all participants within 500 milliseconds
2. WHEN a claim is submitted, THE Tambola_System SHALL notify the host within 500 milliseconds
3. WHEN a claim is approved or rejected, THE Tambola_System SHALL update all participants within 500 milliseconds
4. WHEN any game state changes, THE Tambola_System SHALL synchronize updates without requiring page refresh
5. WHEN communicating real-time events, THE Tambola_System SHALL scope all communications to the specific room only

### Requirement 8: Room Access Control

**User Story:** As a host, I want to prevent participants from joining after the game has started, so that the game remains fair and organized.

#### Acceptance Criteria

1. WHEN a participant attempts to join a room, THE Tambola_System SHALL check if the game has started
2. IF the game has started, THEN THE Tambola_System SHALL reject the join request and display an appropriate message
3. WHEN a participant successfully joins before game start, THE Tambola_System SHALL add them to the room and assign a ticket
4. WHEN the host starts the game, THE Tambola_System SHALL transition the room state to prevent new joins

### Requirement 9: Connection Resilience

**User Story:** As a participant, I want to rejoin a game if my connection drops, so that I can continue playing without losing my progress.

#### Acceptance Criteria

1. WHEN a participant's connection drops during an active game, THE Tambola_System SHALL maintain their ticket and game state
2. WHEN a participant reconnects using the same room code, THE Tambola_System SHALL restore their ticket and current game state
3. WHEN the host disconnects, THE Tambola_System SHALL pause the game and prevent number calling
4. WHEN the host reconnects, THE Tambola_System SHALL restore the game state and allow the host to resume

### Requirement 10: Duplicate Claim Handling

**User Story:** As a host, I want the system to handle multiple claims for the same prize fairly, so that I can verify claims in the order they were received.

#### Acceptance Criteria

1. WHEN multiple participants submit claims for the same prize simultaneously, THE Tambola_System SHALL queue the claims in the order received
2. WHEN the host approves a claim that exhausts a prize's frequency, THE Tambola_System SHALL mark that prize as unavailable
3. WHEN a prize becomes unavailable, THE Tambola_System SHALL reject any pending claims for that prize
4. WHEN the host is verifying a claim, THE Tambola_System SHALL display the timestamp of claim submission

### Requirement 11: Art-Directed Frontend Design

**User Story:** As a user, I want the interface to feel intentional and art-directed with strong visual identity, so that the experience feels human and engaging rather than generic.

#### Acceptance Criteria

1. WHEN rendering typography, THE Tambola_System SHALL use bold, expressive, character-rich fonts that avoid Inter, Arial, Roboto, system-ui, and Space Grotesk
2. WHEN applying color themes, THE Tambola_System SHALL implement high-contrast palettes using CSS variables and avoid white-to-purple-to-blue gradients
3. WHEN implementing animations, THE Tambola_System SHALL use purposeful motion through CSS animations or Framer Motion
4. WHEN rendering backgrounds, THE Tambola_System SHALL incorporate texture, noise, grids, or subtle geometry to add depth
5. WHEN designing UI components, THE Tambola_System SHALL avoid generic hero layouts, homogenous cards, and safe familiar patterns
