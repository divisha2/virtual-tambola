# Design Document: Virtual Tambola Game Platform

## Overview

The Virtual Tambola Game Platform is a real-time multiplayer web application that enables hosts to create and manage Tambola games while participants join remotely to play. The system is built on a client-server architecture with WebSocket-based real-time communication, ensuring synchronized game state across all connected clients.

The platform consists of three main layers:
1. **Frontend Layer**: React.js application with Tailwind CSS and Framer Motion for art-directed UI
2. **Backend Layer**: Node.js/Express.js server with Socket.IO for real-time communication
3. **Data Layer**: Firebase Firestore for persistent storage and real-time synchronization

The design prioritizes host authority, transparent game flow, and a distinctive visual identity that avoids generic UI patterns.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Application (Vercel)                            │ │
│  │  - Host Dashboard                                      │ │
│  │  - Participant Game View                              │ │
│  │  - Claim Verification Panel                           │ │
│  │  - Tailwind CSS + Framer Motion                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕ Socket.IO                        │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Backend Layer (Render/Railway)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Node.js + Express.js Server                          │ │
│  │  - Room Management Service                            │ │
│  │  - Game State Manager                                 │ │
│  │  - Ticket Generator                                   │ │
│  │  - Claim Verification Service                         │ │
│  │  - Socket.IO Event Handlers                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (Firebase)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Firestore Collections                                │ │
│  │  - rooms                                              │ │
│  │  - tickets                                            │ │
│  │  - claims                                             │ │
│  │  Firebase Anonymous Auth                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **Room Creation**: Host → Backend → Firestore → Backend → Host
2. **Participant Join**: Participant → Backend → Firestore → Backend → All Clients (via Socket.IO)
3. **Number Call**: Host → Backend → Firestore → All Participants (via Socket.IO)
4. **Claim Submission**: Participant → Backend → Host (via Socket.IO)
5. **Claim Verification**: Host → Backend → Firestore → All Clients (via Socket.IO)

## Components and Interfaces

### Frontend Components

#### 1. Landing/Join Room Component
- **Purpose**: Entry point for both hosts and participants
- **State**: Room code input, user display name, loading state
- **Actions**: Create room, join room
- **Props**: None (root component)

#### 2. Host Dashboard Component
- **Purpose**: Main control interface for hosts
- **State**: Room code, prize configuration, game status, called numbers
- **Sub-components**:
  - Prize Configuration Panel
  - Number Board (1-90 grid)
  - Claim Verification Modal
  - Participant List
- **Actions**: Configure prizes, start game, call next number, verify claims

#### 3. Participant Game View Component
- **Purpose**: Main gameplay interface for participants
- **State**: Ticket data, called numbers, current number, claim status
- **Sub-components**:
  - Ticket Display (3×9 grid)
  - Current Number Display
  - Number History Display
  - Claim Button
  - Prize Selection Modal
- **Actions**: Submit claim, select prize type

#### 4. Claim Verification Panel Component
- **Purpose**: Host interface for verifying participant claims
- **State**: Pending claims queue, selected claim details
- **Props**: Claim data (participant name, ticket, prize type, timestamp)
- **Actions**: Approve claim, reject claim

#### 5. Winner Announcement Overlay Component
- **Purpose**: Display winner notifications to all participants
- **State**: Winner name, prize type, animation state
- **Props**: Winner data
- **Actions**: Dismiss notification

### Backend Services

#### 1. Room Management Service
```typescript
interface RoomService {
  createRoom(hostName: string): Promise<RoomData>
  joinRoom(roomCode: string, participantName: string): Promise<JoinResult>
  getRoomState(roomCode: string): Promise<RoomState>
  startGame(roomCode: string): Promise<void>
  pauseGame(roomCode: string): Promise<void>
}
```

**Responsibilities**:
- Generate unique room codes
- Validate room access
- Manage room lifecycle
- Track participant connections

#### 2. Ticket Generator Service
```typescript
interface TicketGenerator {
  generateTicket(roomCode: string, userId: string): Promise<Ticket>
  validateTicketUniqueness(roomCode: string, ticket: Ticket): boolean
}
```

**Responsibilities**:
- Generate valid Tambola tickets (3×9 grid, 15 numbers)
- Ensure uniqueness within room
- Assign tickets to users

#### 3. Game State Manager
```typescript
interface GameStateManager {
  callNextNumber(roomCode: string): Promise<number>
  getCalledNumbers(roomCode: string): Promise<number[]>
  getCurrentNumber(roomCode: string): Promise<number | null>
  markNumberOnTickets(roomCode: string, number: number): Promise<void>
}
```

**Responsibilities**:
- Manage number calling sequence
- Track called numbers
- Prevent duplicate calls
- Broadcast number updates

#### 4. Prize Configuration Service
```typescript
interface PrizeService {
  configurePrizes(roomCode: string, prizes: PrizeConfig[]): Promise<void>
  getPrizeAvailability(roomCode: string): Promise<PrizeAvailability[]>
  decrementPrizeFrequency(roomCode: string, prizeType: string): Promise<void>
  lockPrizeConfiguration(roomCode: string): Promise<void>
}
```

**Responsibilities**:
- Store prize configurations
- Track prize frequencies
- Lock configuration after game start
- Validate prize availability

#### 5. Claim Verification Service
```typescript
interface ClaimService {
  submitClaim(roomCode: string, userId: string, prizeType: string): Promise<ClaimResult>
  validateClaim(ticket: Ticket, calledNumbers: number[], prizeType: string): boolean
  approveClaim(claimId: string): Promise<void>
  rejectClaim(claimId: string): Promise<void>
  getClaimQueue(roomCode: string): Promise<Claim[]>
}
```

**Responsibilities**:
- Queue claim submissions
- Validate claim legitimacy
- Process host decisions
- Broadcast results

### Socket.IO Events

#### Client → Server Events
- `create_room`: Host creates new room
- `join_room`: Participant joins room
- `configure_prizes`: Host sets prize configuration
- `start_game`: Host starts the game
- `call_number`: Host calls next number
- `submit_claim`: Participant submits prize claim
- `verify_claim`: Host approves/rejects claim
- `disconnect`: User disconnects
- `reconnect`: User reconnects

#### Server → Client Events
- `room_created`: Room successfully created
- `room_joined`: Successfully joined room
- `participant_joined`: New participant joined (broadcast)
- `game_started`: Game has started (broadcast)
- `number_called`: New number called (broadcast)
- `ticket_updated`: Ticket numbers marked (individual)
- `claim_received`: New claim for host verification (host only)
- `claim_approved`: Claim approved (broadcast)
- `claim_rejected`: Claim rejected (individual)
- `winner_announced`: Winner announcement (broadcast)
- `prize_unavailable`: Prize frequency exhausted (broadcast)
- `game_paused`: Host disconnected (broadcast)
- `error`: Error message (individual)

## Data Models

### Room Document
```typescript
interface Room {
  roomCode: string;           // Unique identifier (e.g., "TMB-7F92")
  hostId: string;             // Firebase Auth UID
  hostName: string;           // Display name
  status: 'waiting' | 'active' | 'paused' | 'completed';
  createdAt: Timestamp;
  startedAt: Timestamp | null;
  prizes: PrizeConfig[];
  prizesLocked: boolean;
  calledNumbers: number[];    // Array of called numbers in order
  currentNumber: number | null;
  participants: Participant[];
  maxParticipants: number;    // Default: 50
}
```

### Prize Configuration
```typescript
interface PrizeConfig {
  type: 'early_five' | 'top_row' | 'middle_row' | 'bottom_row' | 'full_house';
  maxWinners: number;         // Frequency
  currentWinners: number;     // Count of winners so far
  available: boolean;         // Derived: currentWinners < maxWinners
}
```

### Ticket Document
```typescript
interface Ticket {
  ticketId: string;           // Unique identifier
  roomCode: string;           // Foreign key
  userId: string;             // Firebase Auth UID
  userName: string;           // Display name
  grid: (number | null)[][];  // 3×9 array (null for empty cells)
  markedNumbers: number[];    // Numbers that have been called
  createdAt: Timestamp;
}
```

### Participant
```typescript
interface Participant {
  userId: string;             // Firebase Auth UID
  userName: string;           // Display name
  ticketId: string;           // Reference to ticket
  connected: boolean;         // Connection status
  joinedAt: Timestamp;
}
```

### Claim Document
```typescript
interface Claim {
  claimId: string;            // Unique identifier
  roomCode: string;           // Foreign key
  userId: string;             // Claimant's UID
  userName: string;           // Claimant's display name
  ticketId: string;           // Reference to ticket
  prizeType: string;          // Type of prize claimed
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  verifiedAt: Timestamp | null;
  verifiedBy: string | null;  // Host UID
}
```

### Ticket Generation Algorithm

The ticket generator must create valid Tambola tickets following these rules:
- 3 rows × 9 columns
- Each row contains exactly 5 numbers
- Each column can contain 0-3 numbers
- Column 0: numbers 1-9
- Column 1: numbers 10-19
- Column 2: numbers 20-29
- ...
- Column 8: numbers 80-90
- All 15 numbers must be unique
- Numbers in each column must be sorted ascending

**Algorithm**:
1. Initialize 3×9 grid with all null values
2. For each column (0-8):
   - Determine valid number range
   - Randomly select 0-3 numbers from range
   - Distribute numbers across rows ensuring 5 per row
3. Sort numbers within each column
4. Validate ticket uniqueness within room
5. Return ticket or regenerate if duplicate



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room Code Generation Format and Uniqueness
*For any* room creation request, the generated room code should match the format "TMB-XXXX" (where X is alphanumeric) and should be unique across all active game sessions.
**Validates: Requirements 1.1, 1.2**

### Property 2: Display Name Validation
*For any* display name input, the system should accept names that are alphanumeric and between 2-30 characters, and reject all other inputs.
**Validates: Requirements 1.3**

### Property 3: Room Code Validity Lifecycle
*For any* room, after the game session ends, the room code should become invalid and not be reusable for new sessions.
**Validates: Requirements 1.4**

### Property 4: Case-Insensitive Room Code Resolution
*For any* valid room code, all case variations of that code (uppercase, lowercase, mixed) should resolve to the same room.
**Validates: Requirements 1.5**

### Property 5: Prize Type Validation
*For any* prize configuration before game start, the system should accept only the predefined prize types (Early Five, Top Row, Middle Row, Bottom Row, Full House) and reject invalid types.
**Validates: Requirements 2.1**

### Property 6: Prize Frequency Validation
*For any* prize frequency assignment, the system should accept positive integer values and reject zero, negative, or non-integer values.
**Validates: Requirements 2.2**

### Property 7: Prize Configuration Lock on Game Start
*For any* room, after the game starts, all attempts to modify prize configuration should be rejected and the configuration should remain unchanged.
**Validates: Requirements 2.3, 2.5**

### Property 8: Prize Availability Tracking
*For any* prize with frequency N, after N claims are approved, the prize should be marked as unavailable and further claims for that prize should be rejected.
**Validates: Requirements 2.4, 10.2**

### Property 9: Ticket Structure Invariant
*For any* generated ticket, the structure should be exactly 3 rows by 9 columns containing exactly 15 numbers (non-null cells).
**Validates: Requirements 3.1**

### Property 10: Ticket Number Range Constraint
*For any* generated ticket, all numbers in the ticket should be within the range 1 to 90 inclusive.
**Validates: Requirements 3.2**

### Property 11: Ticket Uniqueness Within Room
*For any* room, all generated tickets should be unique (no two tickets should have identical number arrangements).
**Validates: Requirements 3.3**

### Property 12: Automatic Ticket Assignment on Join
*For any* participant who successfully joins a room before game start, the system should automatically generate and assign a unique ticket to that participant.
**Validates: Requirements 3.5, 8.3**

### Property 13: Automatic Number Marking on Tickets
*For any* number called during gameplay, that number should be automatically marked on all tickets that contain it.
**Validates: Requirements 3.6, 5.2**

### Property 14: Number Selection from Remaining Pool
*For any* "Next Number" call, the selected number should be from the set of numbers not yet called in that game session.
**Validates: Requirements 4.2**

### Property 15: No Duplicate Number Calls
*For any* game session, the list of called numbers should contain no duplicates.
**Validates: Requirements 4.3**

### Property 16: Number Broadcast to All Participants
*For any* number called by the host, all connected participants in that room should receive the number update.
**Validates: Requirements 4.4**

### Property 17: Current Number and History Tracking
*For any* number call, the system should update the current number to the newly called number and add the previous current number to the history.
**Validates: Requirements 4.5**

### Property 18: Previous Numbers Availability
*For any* game state, the system should provide access to at least the previous two called numbers (or all called numbers if fewer than two have been called).
**Validates: Requirements 5.4**

### Property 19: Claim Data Completeness
*For any* claim submitted to the host, the claim should include participant name, complete ticket snapshot, claimed prize type, and submission timestamp.
**Validates: Requirements 6.2, 6.3, 10.4**

### Property 20: Prize Frequency Decrement on Approval
*For any* approved claim, the frequency count for that prize type should decrease by exactly one.
**Validates: Requirements 6.4**

### Property 21: Winner Announcement Broadcast
*For any* approved claim, all participants in the room should receive a winner announcement containing the winner's name and prize type.
**Validates: Requirements 6.5**

### Property 22: Rejection Notification to Claimant
*For any* rejected claim, the participant who submitted the claim should receive a rejection notification.
**Validates: Requirements 6.6**

### Property 23: Game Continuation After Rejection
*For any* rejected claim, the game state should remain unchanged and number calling should remain available to the host.
**Validates: Requirements 6.7**

### Property 24: Real-Time State Synchronization
*For any* game state change, all connected clients should receive the update without requiring manual page refresh.
**Validates: Requirements 7.4**

### Property 25: Room-Scoped Event Isolation
*For any* event in a room, only participants and the host of that specific room should receive the event (no cross-room leakage).
**Validates: Requirements 7.5**

### Property 26: Join Attempt Validation Against Game Status
*For any* join attempt, the system should check the current game status and only allow joins if the game has not started.
**Validates: Requirements 8.1, 8.2**

### Property 27: Room State Transition on Game Start
*For any* room, when the host starts the game, the room status should transition to "active" and subsequent join attempts should be rejected.
**Validates: Requirements 8.4**

### Property 28: State Persistence on Participant Disconnect
*For any* participant who disconnects, their ticket and game progress should be preserved in the system.
**Validates: Requirements 9.1**

### Property 29: State Restoration on Participant Reconnect
*For any* participant who reconnects to their room using the same credentials, their ticket and all marked numbers should be restored to the current game state.
**Validates: Requirements 9.2**

### Property 30: Game Pause on Host Disconnect
*For any* room, when the host disconnects, the game status should transition to "paused" and number calling should be disabled.
**Validates: Requirements 9.3**

### Property 31: Game Resume on Host Reconnect
*For any* paused room, when the host reconnects, the game state should be restored and the host should be able to resume calling numbers.
**Validates: Requirements 9.4**

### Property 32: Claim Queue Ordering
*For any* set of claims submitted concurrently, the claims should be queued and presented to the host in the order they were received (timestamp-based ordering).
**Validates: Requirements 10.1**

### Property 33: Pending Claim Rejection on Prize Exhaustion
*For any* prize that becomes unavailable, all pending claims for that prize should be automatically rejected.
**Validates: Requirements 10.3**

## Error Handling

### Client-Side Error Handling

**Network Errors**:
- Display user-friendly error messages for connection failures
- Implement automatic reconnection with exponential backoff
- Show connection status indicator in UI
- Queue actions during disconnection and retry on reconnection

**Invalid Input Errors**:
- Validate room codes before submission
- Validate display names (length, characters)
- Provide immediate feedback on invalid inputs
- Prevent form submission with invalid data

**Room Access Errors**:
- Handle "room not found" scenarios
- Handle "game already started" scenarios
- Handle "room full" scenarios
- Provide clear error messages and suggested actions

### Server-Side Error Handling

**Room Management Errors**:
- Handle room code collision (retry generation)
- Handle invalid room access attempts
- Handle participant limit exceeded
- Log all room-related errors for debugging

**Game State Errors**:
- Handle invalid number call attempts (already called)
- Handle claim validation failures
- Handle prize configuration errors
- Maintain game state consistency on errors

**Database Errors**:
- Implement retry logic for transient Firestore errors
- Handle document not found scenarios
- Handle concurrent modification conflicts
- Log all database errors with context

**Socket.IO Errors**:
- Handle disconnection gracefully
- Implement reconnection logic
- Handle message delivery failures
- Validate all incoming events

### Error Recovery Strategies

**Automatic Recovery**:
- Reconnect on network failure
- Retry failed operations (with limits)
- Restore state from Firestore on reconnection
- Sync state on reconnection

**Manual Recovery**:
- Provide "Refresh" button for stuck states
- Allow host to manually pause/resume game
- Provide admin controls for error scenarios
- Log errors for support investigation

## Testing Strategy

### Dual Testing Approach

This system requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Test specific ticket generation examples
- Test specific claim validation scenarios
- Test error handling paths
- Test integration between components

**Property-Based Tests**: Verify universal properties across all inputs
- Test properties hold for randomly generated inputs
- Catch edge cases that manual testing might miss
- Provide confidence in correctness across the input space

Both testing approaches are complementary and necessary for comprehensive coverage.

### Property-Based Testing Configuration

**Framework**: Use `fast-check` library for JavaScript/TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each property test must reference its design document property
- Tag format: `// Feature: virtual-tambola-game, Property N: [property text]`

**Example Property Test Structure**:
```typescript
// Feature: virtual-tambola-game, Property 1: Room Code Generation Format and Uniqueness
test('room codes match format and are unique', () => {
  fc.assert(
    fc.property(fc.string(), (hostName) => {
      const code1 = generateRoomCode();
      const code2 = generateRoomCode();
      
      // Check format
      expect(code1).toMatch(/^TMB-[A-Z0-9]{4}$/);
      
      // Check uniqueness (statistical test over many runs)
      expect(code1).not.toBe(code2);
    }),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Frontend Unit Tests**:
- Component rendering tests (React Testing Library)
- User interaction tests (click, input, form submission)
- State management tests
- Animation trigger tests
- Error display tests

**Backend Unit Tests**:
- Service method tests
- Ticket generation algorithm tests
- Claim validation logic tests
- Room code generation tests
- Prize configuration tests

**Integration Tests**:
- Socket.IO event flow tests
- End-to-end claim verification flow
- Room creation to game completion flow
- Reconnection flow tests

### Test Coverage Goals

- Minimum 80% code coverage
- 100% coverage of critical paths (ticket generation, claim validation, number calling)
- All 33 correctness properties implemented as property-based tests
- All error handling paths covered by unit tests

### Testing Tools

- **Jest**: Test runner and assertion library
- **fast-check**: Property-based testing library
- **React Testing Library**: Frontend component testing
- **Socket.IO Client**: Socket event testing
- **Firebase Emulator**: Local Firestore testing

### Continuous Integration

- Run all tests on every commit
- Run property tests with increased iterations (1000+) on main branch
- Fail build on test failures
- Generate coverage reports
- Monitor test execution time
