# PortShadow — AGENT.md

## 1. Project Identity

### Project Name
PortShadow

### Project Title
**PortShadow — Delayed Packet Isolation After Transport-Port Reuse**

### One-Line Description
> PortShadow is an incarnation-aware transport-layer simulation engine that safely isolates delayed packets from previous connection incarnations after rapid endpoint/port reuse.

---

# 2. Problem Statement

High-connection-rate systems can reuse an ephemeral transport port soon after an earlier connection closes.

If packets from the old connection remain delayed in the network, the reused endpoint tuple can make those packets look superficially related to the new connection.

This creates a risk that stale data from the old connection could be accepted into the state of the new connection rather than being discarded.

PortShadow simulates this problem entirely in software.

The simulator must:

1. Create connections.
2. Assign an incarnation to every connection lifetime.
3. Send packets.
4. Delay packets.
5. Reorder packets.
6. Duplicate packets.
7. Drop packets.
8. Close connections.
9. Rapidly reuse the same endpoint/port.
10. Create a new incarnation for the reused endpoint.
11. Detect packets belonging to an earlier incarnation.
12. Reject stale packets.
13. Continue accepting legitimate packets belonging to the new incarnation.
14. Support legitimate retransmissions.
15. Distinguish stale packets from out-of-order packets.
16. Demonstrate why a naive age-based filter is insufficient.

There is no requirement for a physical network.

The entire network, forwarding state, endpoints, packets, connections, and traffic are software simulated.

---

# 3. Core Security / Correctness Goal

The primary invariant of PortShadow is:

> **A packet belonging to an earlier connection incarnation must never modify the state of the active connection incarnation.**

This is the most important correctness property of the entire system.

---

# 4. Core Technical Concept

A transport endpoint can be represented using a 4-tuple:

- source IP
- source port
- destination IP
- destination port

Example:

```text
10.0.0.1:5000 → 10.0.0.2:8080
```

Suppose Connection A uses:

```text
10.0.0.1:5000 → 10.0.0.2:8080
```

A packet from Connection A can be delayed.

Then Connection A closes.

The same endpoint can immediately be reused:

```text
10.0.0.1:5000 → 10.0.0.2:8080
```

by Connection B.

The 4-tuple is now identical.

Therefore:

```text
4-tuple alone
    ↓
cannot distinguish
    ↓
Connection A vs Connection B
```

PortShadow adds an explicit simulation-level connection generation identifier:

```text
incarnationId
```

Therefore:

```text
4-tuple + incarnationId
```

can distinguish the active connection generation from the previous one.

---

# 5. Important TCP Terminology

The word **incarnation** is intentionally used because TCP terminology discusses successive instances of a connection as different "incarnations."

The current TCP specification is RFC 9293.

TCP itself does NOT have a normal header field called:

```text
incarnation_id
```

PortShadow introduces:

```text
incarnationId
```

as an explicit identifier inside the simulation.

This makes the logical connection generation visible and deterministic for the demonstration.

Real TCP uses mechanisms including:

- sequence number spaces
- Initial Sequence Numbers (ISNs)
- TIME-WAIT
- timestamps
- PAWS
- other protocol-state mechanisms

PortShadow is therefore a simulation/teaching/verification system rather than a replacement for TCP.

Judge explanation:

> "In TCP terminology, an incarnation is a new instance or generation of a connection. Our simulator makes that logical identity explicit with an `incarnationId` so we can deterministically demonstrate stale-packet isolation. Real TCP does not have this UUID field; it uses mechanisms such as sequence numbers, TIME-WAIT, and timestamps."

---

# 6. Incarnation ID

Every connection lifetime receives exactly one incarnation ID.

Example:

```text
Connection A
incarnation = A7F91C2D
```

When A closes and B reuses the same endpoint:

```text
Connection B
incarnation = C29D82F1
```

The packet inherits the incarnation ID of the connection that generated it.

A packet does NOT receive a new incarnation ID.

Correct:

```text
Connection A
    ↓
incarnation A7F91C2D
    ↓
A1 → A7F91C2D
A2 → A7F91C2D
A3 → A7F91C2D
```

---

# 7. Incarnation ID Generation

Use Node.js built-in cryptographic UUID generation.

```javascript
import crypto from "node:crypto";

const incarnationId = crypto.randomUUID();
```

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

A UUID v4 is:

- 128 bits total
- 16 bytes
- 32 hexadecimal characters
- approximately 122 random bits

The UUID should be stored in its complete form internally.

The UI may display a shortened version for readability.

Example:

```text
Full:
550e8400-e29b-41d4-a716-446655440000

UI:
550e8400
```

Do NOT truncate the identifier internally.

---

# 8. Why 128 Bits?

### 32-bit

```text
2^32
```

Possible for a small simulator, but collision probability becomes relevant much sooner.

### 64-bit

```text
2^64
```

Much better, but still less convenient than a standard UUID.

### 128-bit

```text
UUID
```

Recommended.

Advantages:

- standard
- easy to generate
- easy to serialize
- extremely low accidental collision probability
- supported directly by Node.js
- easy to log

### 256-bit / 512-bit

Possible, but unnecessary.

They increase identifier size and storage/serialization overhead without providing meaningful value for this simulator.

Therefore:

> **Use UUID v4 / 128-bit incarnation IDs internally.**

The UUID is an identity mechanism, not an authentication mechanism.

---

# 9. Endpoint / Tuple

PortShadow uses:

```text
sourceIp
sourcePort
destinationIp
destinationPort
```

Example:

```text
10.0.0.1:5000 → 10.0.0.2:8080
```

The important scenario is:

```text
Connection A
10.0.0.1:5000 → 10.0.0.2:8080

CLOSE

Connection B
10.0.0.1:5000 → 10.0.0.2:8080
```

Same tuple.

Different incarnation.

---

# 10. Connection Lifecycle

A connection has a lifecycle:

```text
NEW
 ↓
CONNECTING
 ↓
ESTABLISHED
 ↓
CLOSING
 ↓
CLOSED
```

A simplified handshake should be simulated:

```text
CLIENT                 SERVER

CONNECT/SYN ─────────►

ACCEPT/SYN-ACK ◄──────

CONFIRM/ACK ─────────►

ESTABLISHED ✓
```

This is a simulation and does not claim to implement the complete TCP protocol.

---

# 11. Connection A / Connection B Scenario

The primary scenario is:

```text
Connection A
incarnation = A7F9
```

A sends:

```text
A1
A2
A3
```

A2 is delayed.

A1 and A3 arrive normally.

Then:

```text
Connection A closes
```

A tombstone is created.

Immediately:

```text
Connection B
same 4-tuple
new incarnation = C29D
```

B sends:

```text
B1
```

B1 is accepted.

Then delayed A2 is released.

A2 contains:

```text
incarnation = A7F9
```

But active B contains:

```text
incarnation = C29D
```

Therefore:

```text
A7F9 !== C29D
```

A2 is rejected.

Then B2 arrives.

B2 contains:

```text
incarnation = C29D
```

Therefore:

```text
C29D === C29D
```

B2 is accepted.

---

# 12. Main Demo Timeline

```text
Connection A / A7F9

A1 → ACCEPT

A2 → DELAY

A3 → ACCEPT

A CLOSES

TOMBSTONE CREATED

Connection B / C29D

B1 → ACCEPT

RELEASE DELAYED A2

A7F9 !== C29D

A2 → REJECT / STALE_INCARNATION

B2 → ACCEPT
```

The central demonstration should clearly show:

```text
A2 [A7F9] → ❌ REJECTED / STALE

B2 [C29D] → ✅ ACCEPTED / CURRENT
```

---

# 13. Key Concept

> **We are not preventing the old packet from arriving. We are preventing the old packet from becoming part of the new connection.**

---

# 14. Hotel Analogy

Use a hotel analogy for judges.

```text
Room number = endpoint / IP + port

Alice's stay = Connection A

Bob's stay = Connection B

Stay ID = incarnation ID

Package = packet

Courier delay = network delay

Reception = receiver
```

Example:

Alice stays in:

```text
Room 500
Stay ID = A7F9
```

A package for Alice is delayed.

Alice checks out.

Bob immediately checks into:

```text
Room 500
Stay ID = C29D
```

The old package finally arrives.

The room number is correct.

But the stay ID is wrong.

Therefore:

```text
Room = correct
Stay generation = wrong
```

Reject the package.

Judge explanation:

> "The room number tells us where the package is going, but the stay ID tells us which guest generation it belongs to."

---

# 15. Packet Model

Every simulated packet should contain enough information for deterministic processing.

Recommended structure:

```javascript
{
  packetId,
  sourceIp,
  sourcePort,
  destinationIp,
  destinationPort,
  connectionId,
  incarnationId,
  sequenceNumber,
  payload,
  createdAt,
  deliveryAt,
  status
}
```

Example:

```json
{
  "packetId": "A2",
  "sourceIp": "10.0.0.1",
  "sourcePort": 5000,
  "destinationIp": "10.0.0.2",
  "destinationPort": 8080,
  "connectionId": "connection-A",
  "incarnationId": "A7F91C2D",
  "sequenceNumber": 101,
  "payload": "DATA-2",
  "createdAt": 1757050000000,
  "deliveryAt": 1757050005000,
  "status": "DELAYED"
}
```

---

# 16. Packet IDs

`packetId` identifies an individual simulated packet.

Example:

```text
A1
A2
A3
B1
B2
```

Do not confuse:

```text
packetId
```

with:

```text
incarnationId
```

Example:

```text
A2
incarnation = A7F91C2D
sequence = 101
```

---

# 17. Sequence Numbers

Sequence numbers model transport-level ordering.

Example:

```text
B1 → sequence 200
B2 → sequence 201
B3 → sequence 202
```

Sequence numbers should be used after incarnation validation.

Recommended validation order:

```text
4-tuple
    ↓
active connection
    ↓
incarnation
    ↓
sequence
```

---

# 18. Receiver Validation

Incoming packet:

```text
Packet
 ↓
4-tuple lookup
 ├── no active connection
 │      ↓
 │   UNKNOWN_CONNECTION
 │
 └── active connection found
        ↓
     incarnation matches?
        │
        ├── NO
        │    ↓
        │ STALE_INCARNATION
        │
        └── YES
             ↓
        sequence validation
             │
             ├── expected → ACCEPT
             │
             ├── already seen → DUPLICATE / DEDUPLICATE
             │
             └── future/out-of-order → BUFFER
```

---

# 19. Core Validation Function

```javascript
function validatePacket(packet, activeConnection) {
  if (!activeConnection) {
    return {
      status: "REJECTED",
      reason: "UNKNOWN_CONNECTION"
    };
  }

  if (
    packet.incarnationId !==
    activeConnection.incarnationId
  ) {
    return {
      status: "REJECTED",
      reason: "STALE_INCARNATION"
    };
  }

  return {
    status: "ACCEPTED",
    reason: "CURRENT_INCARNATION"
  };
}
```

The incarnation check MUST happen before state mutation.

---

# 20. State Mutation Rule

Never do this before validation:

```javascript
connection.sequence = packet.sequenceNumber;
```

Correct:

```text
packet arrives
 ↓
lookup active connection
 ↓
validate incarnation
 ↓
if stale:
    reject
    log
    DO NOT mutate state
 ↓
if current:
    continue validation
    update state
```

The old packet must not alter:

- sequence state
- receive buffer
- application payload
- connection state
- retransmission state
- ordering state

except for explicitly recorded rejection/logging metrics.

---

# 21. Tombstones

A tombstone is a small historical record retained after a connection closes.

Purpose:

> Remember that an endpoint previously belonged to an older connection incarnation without preventing immediate endpoint reuse.

When Connection A closes:

```text
Active A
 ↓
remove from active connection table
 ↓
create tombstone
```

Example tombstone:

```text
TOMBSTONE

4-tuple:
10.0.0.1:5000 → 10.0.0.2:8080

old incarnation:
A7F91C2D

last sequence:
1042

close state:
CLOSED

created_at:
T

expires_at:
T + 5 seconds
```

---

# 22. Active Table vs Tombstone Table

### Active Table

Answers:

> Who owns this endpoint NOW?

Example:

```text
10.0.0.1:5000 → 10.0.0.2:8080
    ↓
Connection B
incarnation C29D
```

### Tombstone Table

Answers:

> Who owned this endpoint PREVIOUSLY?

Example:

```text
10.0.0.1:5000 → 10.0.0.2:8080
    ↓
Connection A
incarnation A7F9
closed
```

The tombstone does NOT determine the active connection.

The tombstone does NOT block reuse.

---

# 23. Immediate Reuse

PortShadow explicitly allows:

```text
A closes
 ↓
tombstone created
 ↓
B immediately reuses endpoint
```

This is important.

The project should NOT solve the problem simply by imposing a long global reuse delay.

The design goal is:

> **Reject stale traffic while keeping the new connection usable.**

---

# 24. Tombstone Storage

Use an in-memory JavaScript `Map`.

```javascript
const tombstones = new Map();
```

Example:

```javascript
tombstones.set(tupleKey, {
  fourTuple,
  incarnationId,
  lastSequence,
  closedAt,
  expiresAt
});
```

Suggested record:

```javascript
{
  fourTuple,
  incarnationId,
  lastSequence,
  closedAt,
  expiresAt
}
```

---

# 25. Tombstone Expiration

Tombstones must be bounded.

Example:

```text
TTL = 5 seconds
```

The exact TTL should be configurable.

When expired:

```text
tombstone
 ↓
delete
```

Do not allow unlimited historical tombstones.

---

# 26. Important Tombstone Rule

Tombstones are a **PortShadow design pattern**.

They are not a claim that TCP itself defines a generic data structure called a "tombstone."

They are used by the simulator to preserve bounded historical context.

---

# 27. Why Sequence Number Alone Is Not Enough

Do not make sequence number the primary stale detector.

The main stale detector is:

```text
incarnation mismatch
```

Example:

```text
Old A packet:
incarnation = A7F9
sequence = 101

Current B:
incarnation = C29D
```

Even if sequence `101` looks reasonable, the packet belongs to the wrong incarnation.

Therefore:

```text
A7F9 !== C29D
```

Reject.

---

# 28. Naive Age-Based Filter

A naive implementation might do:

```javascript
if (packetAge < 5000) {
  accept(packet);
}
```

This is insufficient.

Example 1:

```text
A packet
age = 1 second
incarnation = OLD
```

It is young by time but stale by connection generation.

Example 2:

```text
B retransmission
age = 6 seconds
incarnation = CURRENT
```

It is old by time but still legitimate.

Therefore:

> **Packet age and packet freshness are not the same thing.**

---

# 29. Naive vs PortShadow

### Naive

```text
endpoint + packet age
```

### PortShadow

```text
endpoint
+
incarnation
+
sequence state
```

PortShadow therefore evaluates identity and transport state rather than using time alone.

---

# 30. Legitimate Retransmission

The challenge requires testing a legitimate retransmission belonging to the new connection.

Example:

```text
B1
incarnation = C29D
sequence = 200

↓ packet lost

B1 retransmission
incarnation = C29D
sequence = 200
```

The retransmission is old relative to the first transmission.

But it is still part of the current connection incarnation.

Therefore it should not be rejected as stale.

Possible result:

```text
ACCEPTED
```

or:

```text
DEDUPLICATED
```

depending on whether the first copy has already been processed.

Important:

> **Old by time does not necessarily mean stale.**

---

# 31. Duplicate Packets

Current-incarnation duplicate:

```text
B1
B1
```

The first packet:

```text
ACCEPTED
```

The second:

```text
DUPLICATE
```

or:

```text
DEDUPLICATED
```

A duplicate current packet is NOT automatically a stale packet.

---

# 32. Reordering

Out-of-order traffic is separate from stale traffic.

Example:

```text
B1 seq 200 → ACCEPT

B3 seq 202 → BUFFER

B2 seq 201 → ACCEPT

B3 → RELEASE / PROCESS
```

Important:

> Out-of-order does not mean stale.

The system should classify these separately.

---

# 33. Packet Statuses

Recommended statuses:

```text
CREATED
SENT
DELAYED
RELEASED
ACCEPTED
REJECTED
BUFFERED
DUPLICATE
DROPPED
```

---

# 34. Rejection Reasons

Recommended reasons:

```text
UNKNOWN_CONNECTION
STALE_INCARNATION
INVALID_SEQUENCE
```

Additional classifications can include:

```text
DUPLICATE
OUT_OF_ORDER
```

These should not be incorrectly classified as stale.

---

# 35. Network Simulator

The network is completely simulated.

No physical network is required.

Components:

```text
NetworkSimulator
 ├── DelayEngine
 ├── ReorderEngine
 ├── DuplicateEngine
 └── DropEngine
```

---

# 36. Delay Engine

Purpose:

Hold a packet before delivery.

Example:

```text
A2
 ↓
DELAYED
 ↓
5 seconds
 ↓
RELEASED
```

The delay should be configurable.

---

# 37. Reorder Engine

Purpose:

Deliver packets in a different order from their original sending order.

Example:

```text
A1
A2
A3

Network delivers:

A1
A3
A2
```

---

# 38. Duplicate Engine

Purpose:

Create an additional copy of a packet.

Example:

```text
B1
 ↓
B1
B1
```

---

# 39. Drop Engine

Purpose:

Simulate packet loss.

Example:

```text
B1
 ↓
DROP
```

This can be used to trigger a retransmission scenario.

---

# 40. Connection Manager

Responsibilities:

- create connection
- close connection
- track active connections
- assign endpoint
- assign incarnation
- manage lifecycle
- expose current state

---

# 41. Incarnation Manager

Responsibilities:

- generate incarnation IDs
- associate IDs with connection lifetimes
- ensure each new connection generation receives a new ID

Example:

```javascript
import crypto from "node:crypto";

function createIncarnationId() {
  return crypto.randomUUID();
}
```

---

# 42. Packet Validator

Responsibilities:

1. Find active endpoint.
2. Verify incarnation.
3. Validate sequence state.
4. Detect duplicate.
5. Detect out-of-order.
6. Return a deterministic decision.
7. Prevent stale packets from mutating active state.

---

# 43. Sequence Manager

Responsibilities:

- maintain expected sequence number
- track received sequence numbers
- detect duplicates
- detect out-of-order packets
- manage receive buffer

---

# 44. Tombstone Store

Responsibilities:

- create tombstones on close
- retain old incarnation metadata
- expire tombstones
- remove expired records
- never block new endpoint creation

---

# 45. Event Logger

Every important action should generate a structured event.

Examples:

```text
CONNECTION_CREATED
CONNECTION_ESTABLISHED
CONNECTION_CLOSED
TOMBSTONE_CREATED
PACKET_SENT
PACKET_DELAYED
PACKET_RELEASED
PACKET_ACCEPTED
PACKET_REJECTED
PACKET_BUFFERED
PACKET_DUPLICATE
```

Each event should include enough context to reconstruct what happened.

---

# 46. Suggested Event Format

```javascript
{
  eventId,
  eventType,
  timestamp,
  packetId,
  connectionId,
  incarnationId,
  sourceIp,
  sourcePort,
  destinationIp,
  destinationPort,
  sequenceNumber,
  status,
  reason
}
```

---

# 47. Architecture

```text
┌─────────────────────────────┐
│ React + JavaScript          │
│ Dashboard                   │
└──────────────┬──────────────┘
               │
          REST + Socket.IO
               │
┌──────────────▼──────────────┐
│ Node.js + Express           │
│ JavaScript Backend          │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ PortShadow Core             │
│                             │
│ ConnectionManager           │
│ IncarnationManager          │
│ PacketValidator             │
│ SequenceManager             │
│ TombstoneStore              │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ NetworkSimulator             │
│                             │
│ DelayEngine                  │
│ ReorderEngine                │
│ DuplicateEngine              │
│ DropEngine                   │
└──────────────┬──────────────┘
               │
        In-Memory State
               │
┌──────────────▼──────────────┐
│ Event Logger                 │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ PostgreSQL                   │
│ Historical Data / Analytics  │
└─────────────────────────────┘
```

---

# 48. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend Language | JavaScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Visualization | React Flow |
| Frontend State | Zustand |
| Backend Runtime | Node.js |
| Backend Language | JavaScript |
| API Framework | Express |
| Real-Time Communication | Socket.IO |
| Incarnation ID | Node.js `crypto.randomUUID()` |
| Runtime State | JavaScript `Map` / Objects |
| Database | PostgreSQL |
| ORM | Prisma |
| Unit Testing | Vitest |
| Property-Based Testing | fast-check |
| Logging | Structured logging / console initially |
| Containerization | Docker |
| Frontend Deployment | Vercel |
| Backend Deployment | Render |
| Database Hosting | Managed PostgreSQL |

---

# 49. JavaScript Requirement

The project uses JavaScript.

Do NOT introduce TypeScript unless explicitly requested later.

Use:

```text
.js
.jsx
```

instead of:

```text
.ts
.tsx
```

Examples:

```text
ConnectionManager.js
PacketValidator.js
NetworkSimulator.js
App.jsx
```

---

# 50. Why JavaScript?

JavaScript is appropriate because:

- Node.js provides the backend runtime.
- React uses JavaScript naturally.
- The simulator does not require low-level kernel networking.
- Node's `crypto.randomUUID()` provides UUID generation.
- Express provides simple APIs.
- Socket.IO provides real-time event streaming.
- Development is faster for a hackathon.
- The project already uses Node.js/Express.

---

# 51. Frontend

React should provide the visualization layer.

Responsibilities:

- display connections
- display incarnations
- display packets
- display packet state transitions
- display network topology
- display tombstones
- display metrics
- control simulation scenarios
- display real-time events

---

# 52. React Flow

React Flow should be used for visualizing:

```text
Client
   ↓
Network
   ↓
Server
```

and packet movement.

Example:

```text
┌──────────┐
│ Client A │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Network  │
└────┬─────┘
     │
     ▼
┌──────────┐
│ Server   │
└──────────┘
```

---

# 53. Zustand

Zustand should manage frontend simulation state.

Potential state:

```text
connections
packets
events
metrics
simulationStatus
selectedConnection
selectedPacket
tombstones
```

---

# 54. Backend

Node.js + Express should expose REST APIs.

Socket.IO should stream real-time simulation events.

The backend owns the actual transport simulation logic.

The frontend must NOT decide whether a packet is valid.

---

# 55. Trust Boundary

The backend is authoritative.

Frontend:

```text
display
controls
visualization
```

Backend:

```text
connection state
incarnation state
packet validation
sequence validation
tombstones
simulation
```

Never trust frontend packet-validation decisions.

---

# 56. REST API

Recommended endpoints:

```text
POST   /connections
GET    /connections

POST   /connections/:id/close

POST   /packets

POST   /simulation/start
POST   /simulation/stop

POST   /simulation/scenario

GET    /simulation/status

GET    /metrics

GET    /events
```

---

# 57. POST /connections

Creates a connection.

Request example:

```json
{
  "sourceIp": "10.0.0.1",
  "sourcePort": 5000,
  "destinationIp": "10.0.0.2",
  "destinationPort": 8080
}
```

Server creates:

```text
connectionId
incarnationId
state
sequence state
```

Response example:

```json
{
  "connectionId": "connection-A",
  "incarnationId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "NEW"
}
```

---

# 58. GET /connections

Returns active connections.

Example:

```json
[
  {
    "connectionId": "connection-B",
    "sourceIp": "10.0.0.1",
    "sourcePort": 5000,
    "destinationIp": "10.0.0.2",
    "destinationPort": 8080,
    "incarnationId": "C29D82F1",
    "state": "ESTABLISHED"
  }
]
```

---

# 59. POST /connections/:id/close

Closes a connection.

The backend should:

1. mark connection closed
2. capture relevant historical state
3. create tombstone
4. remove active connection
5. allow endpoint reuse

---

# 60. POST /packets

Creates/sends a simulated packet.

Example:

```json
{
  "connectionId": "connection-B",
  "sequenceNumber": 200,
  "payload": "DATA"
}
```

The backend determines the correct incarnation.

The client should not be trusted to provide arbitrary incarnation state for a real connection.

---

# 61. POST /simulation/scenario

Used to execute predefined scenarios.

Example:

```json
{
  "scenario": "rapid-reuse"
}
```

Possible scenarios:

```text
delayed-packet
rapid-reuse
retransmission
reordering
duplicate
mixed-traffic
```

---

# 62. GET /simulation/status

Returns:

```text
running
paused
stopped
```

and simulation information.

---

# 63. GET /metrics

Returns simulation metrics.

Example:

```json
{
  "totalPackets": 100,
  "accepted": 75,
  "staleRejected": 15,
  "duplicates": 5,
  "outOfOrder": 5
}
```

Do not fabricate benchmark values.

Metrics shown to judges must come from actual execution.

---

# 64. GET /events

Returns event history.

Example:

```json
[
  {
    "eventType": "PACKET_REJECTED",
    "packetId": "A2",
    "reason": "STALE_INCARNATION"
  }
]
```

---

# 65. Socket.IO Events

Recommended real-time events:

```text
PACKET_SENT
PACKET_DELAYED
PACKET_RELEASED
PACKET_ACCEPTED
PACKET_REJECTED
CONNECTION_CREATED
CONNECTION_CLOSED
TOMBSTONE_CREATED
```

The frontend listens to these events and updates the dashboard.

---

# 66. Database Strategy

Runtime simulation state should be kept in memory.

PostgreSQL should be used for persistence and analytics.

### Runtime State

Use JavaScript:

```javascript
Map
Set
Object
Array
```

Runtime state includes:

- active connections
- active incarnation IDs
- connection state
- sequence state
- reorder buffers
- tombstones
- current packets
- simulation configuration
- metrics

### PostgreSQL

Use for:

- simulation history
- historical connection records
- packet events
- scenario results
- benchmark metrics
- audit/debug information

---

# 67. Important Database Rule

Do NOT query PostgreSQL for every packet validation.

Bad:

```text
Packet
 ↓
PostgreSQL
 ↓
Check incarnation
 ↓
Accept/reject
```

This adds unnecessary latency.

Correct:

```text
Packet
 ↓
In-memory active state
 ↓
Validate
 ↓
Accept/reject
 ↓
Optional async persistence/event logging
```

---

# 68. Suggested Database Entities

Potential Prisma models:

```text
Simulation
Connection
PacketEvent
ScenarioRun
BenchmarkResult
```

---

# 69. Connection Historical Record

Possible fields:

```text
id
connectionId
sourceIp
sourcePort
destinationIp
destinationPort
incarnationId
state
createdAt
closedAt
```

---

# 70. Packet Event Record

Possible fields:

```text
id
packetId
connectionId
incarnationId
sequenceNumber
eventType
status
reason
timestamp
```

---

# 71. Scenario Run

Possible fields:

```text
id
scenarioName
startedAt
completedAt
totalPackets
acceptedPackets
rejectedPackets
stalePackets
duplicatePackets
outOfOrderPackets
```

---

# 72. Project File Structure

Recommended structure:

```text
PortShadow/
│
├── README.md
├── AGENT.md
├── package.json
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── server/
│   ├── package.json
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   │
│   └── src/
│       ├── core/
│       │   ├── ConnectionManager.js
│       │   ├── IncarnationManager.js
│       │   ├── PacketValidator.js
│       │   ├── SequenceManager.js
│       │   └── TombstoneStore.js
│       │
│       ├── network/
│       │   ├── NetworkSimulator.js
│       │   ├── DelayEngine.js
│       │   ├── ReorderEngine.js
│       │   ├── DuplicateEngine.js
│       │   └── DropEngine.js
│       │
│       ├── scenarios/
│       │   ├── DelayedPacket.js
│       │   ├── RapidReuse.js
│       │   ├── Retransmission.js
│       │   ├── Reordering.js
│       │   ├── DuplicatePacket.js
│       │   └── MixedTraffic.js
│       │
│       ├── models/
│       │   ├── Connection.js
│       │   ├── Packet.js
│       │   └── Incarnation.js
│       │
│       ├── api/
│       │   └── routes.js
│       │
│       ├── websocket/
│       │   └── socket.js
│       │
│       ├── services/
│       │   ├── MetricsService.js
│       │   └── EventLogger.js
│       │
│       └── server.js
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   │
│   └── src/
│       ├── components/
│       │   ├── ConnectionTable.jsx
│       │   ├── PacketTimeline.jsx
│       │   ├── NetworkGraph.jsx
│       │   ├── TombstonePanel.jsx
│       │   ├── MetricsPanel.jsx
│       │   └── SimulationControls.jsx
│       │
│       ├── pages/
│       │   └── Dashboard.jsx
│       │
│       ├── hooks/
│       │   └── useSocket.js
│       │
│       ├── store/
│       │   └── simulationStore.js
│       │
│       ├── services/
│       │   └── api.js
│       │
│       ├── App.jsx
│       └── main.jsx
│
└── tests/
    ├── unit/
    │   ├── incarnation.test.js
    │   ├── packetValidator.test.js
    │   ├── tombstone.test.js
    │   └── sequence.test.js
    │
    ├── integration/
    │   ├── rapidReuse.test.js
    │   ├── stalePacket.test.js
    │   └── retransmission.test.js
    │
    └── property/
        └── incarnationIsolation.property.test.js
```

---

# 73. Phase Plan

PortShadow is divided into **12 phases**.

```text
PHASE 1  → Project Setup
PHASE 2  → Connection + Incarnation
PHASE 3  → Packet Engine
PHASE 4  → Network Simulator
PHASE 5  → Packet Validation
PHASE 6  → Tombstones + Rapid Reuse
             ⭐ CORE MVP
PHASE 7  → Retransmission + Reordering + Duplication
PHASE 8  → Naive vs PortShadow Comparison
PHASE 9  → Testing + Verification
PHASE 10 → REST + Socket.IO
PHASE 11 → React Dashboard
PHASE 12 → Benchmark + Deployment + Demo
```

---

# 74. Phase 1 — Project Setup

Create:

```text
client
server
tests
```

Configure:

- Node.js
- Express
- React
- Vite
- JavaScript
- basic environment variables
- Git
- package scripts

Goal:

```text
Backend runs
Frontend runs
```

---

# 75. Phase 2 — Connection + Incarnation

Implement:

```text
ConnectionManager
IncarnationManager
Connection lifecycle
```

Every connection receives:

```text
connectionId
incarnationId
```

Use:

```javascript
crypto.randomUUID()
```

Implement:

```text
CREATE
CONNECTING
ESTABLISHED
CLOSING
CLOSED
```

---

# 76. Phase 3 — Packet Engine

Implement:

```text
Packet model
Packet creation
Packet sending
Sequence numbers
Packet state
```

Packets inherit the connection's incarnation.

Example:

```text
B1 → C29D
B2 → C29D
B3 → C29D
```

---

# 77. Phase 4 — Network Simulator

Implement:

```text
DelayEngine
ReorderEngine
DuplicateEngine
DropEngine
```

Support:

```text
delay
reorder
duplicate
drop
```

At the end of this phase, packets should be able to move through an entirely simulated network.

---

# 78. Phase 5 — Packet Validation

Implement:

```text
4-tuple lookup
active connection lookup
incarnation validation
sequence validation
duplicate detection
out-of-order detection
```

Core decision:

```text
4-tuple
 ↓
active connection
 ↓
incarnation
 ↓
sequence
```

---

# 79. Phase 6 — Tombstones + Rapid Reuse

This is the **core MVP phase**.

Implement:

```text
connection close
tombstone creation
immediate endpoint reuse
new incarnation
delayed packet release
stale packet rejection
```

Must demonstrate:

```text
A closes
 ↓
tombstone
 ↓
B reuses same endpoint
 ↓
A packet arrives
 ↓
A incarnation != B incarnation
 ↓
REJECT
 ↓
B traffic continues
```

---

# 80. MVP Definition

### Phases 1–6 = MVP

The MVP must prove the central problem is solved.

Required:

```text
Connection A
 ↓
delayed packet
 ↓
close
 ↓
tombstone
 ↓
immediate endpoint reuse
 ↓
Connection B
 ↓
old A packet released
 ↓
STALE_INCARNATION
 ↓
reject
 ↓
B continues normally
```

---

# 81. Phase 7 — Retransmission + Reordering + Duplication

Add:

```text
legitimate retransmission
duplicate packet
out-of-order packet
```

Required demonstration:

```text
B1 lost

B1 retransmitted

same incarnation

→ valid
```

Also:

```text
B1
B3
B2
```

for reordering.

---

# 82. Phase 8 — Naive vs PortShadow

Implement two validation modes.

### Naive

```text
endpoint + age
```

### PortShadow

```text
endpoint + incarnation + sequence
```

Run the same scenario through both.

The dashboard should show why age-only filtering is insufficient.

Example:

```text
OLD A packet
age = 1 sec
→ Naive: ACCEPT
→ PortShadow: REJECT STALE
```

and:

```text
CURRENT B retransmission
age = 6 sec
→ Naive: REJECT
→ PortShadow: ACCEPT / DEDUPLICATE
```

Do not fabricate results. Generate actual results from the simulator.

---

# 83. Phase 9 — Testing + Verification

Use:

```text
Vitest
fast-check
```

Unit tests:

```text
incarnation creation
packet validation
tombstone creation
tombstone expiration
sequence validation
```

Integration tests:

```text
rapid reuse
stale packet
retransmission
reordering
duplicates
```

Property-based tests:

```text
earlier-incarnation packets never mutate active state
```

---

# 84. Phase 10 — REST + Socket.IO

Expose the simulation through:

```text
Express REST APIs
Socket.IO real-time events
```

This allows the frontend to control and observe the backend simulation.

---

# 85. Phase 11 — React Dashboard

Build:

```text
Connection Table
Packet Timeline
Network Graph
Tombstone Panel
Metrics Panel
Simulation Controls
```

---

# 86. Phase 12 — Benchmark + Deployment + Demo

Final work:

```text
benchmark
performance measurement
Docker
frontend deployment
backend deployment
database deployment
demo preparation
documentation
```

Deployment target:

```text
Frontend → Vercel

Backend → Render

Database → Managed PostgreSQL
```

---

# 87. Completion Levels

## Level 1 — MVP

```text
Phases 1–6
```

Provides the central stale-packet isolation feature.

---

## Level 2 — Strong Hackathon Version

```text
Phases 1–9
```

Adds:

- retransmission
- reordering
- duplicates
- network chaos
- naive comparison
- automated tests
- property-based verification

This is the recommended hackathon target if time is limited.

---

## Level 3 — Complete Polished Project

```text
Phases 1–12
```

Adds:

- REST
- Socket.IO
- React dashboard
- metrics
- benchmarks
- Docker
- deployment
- polished demonstration

---

# 88. Testing Matrix

| Scenario | Expected Result |
|---|---|
| Current packet | ACCEPT |
| Old incarnation packet | REJECT |
| Current retransmission | ACCEPT / DEDUPLICATE |
| Duplicate current packet | DEDUPLICATE |
| Current out-of-order packet | BUFFER |
| Missing endpoint | REJECT / UNKNOWN_CONNECTION |
| Old packet with young age | REJECT |
| Immediate endpoint reuse | ALLOWED |
| Old packet after reuse | REJECT |
| New traffic after stale rejection | ACCEPT |

---

# 89. Core Property-Based Test

The most important property is:

> **Earlier-incarnation packets never mutate active incarnation state.**

Conceptually:

```javascript
for every generated scenario:
    if packet.incarnationId !== active.incarnationId:
        packet must not modify active state
```

This is stronger than testing only one manually constructed scenario.

---

# 90. Example Test Scenario

```text
Create A
 ↓
incarnation A7F9

Send A1
 ↓
ACCEPT

Send A2
 ↓
DELAY

Send A3
 ↓
ACCEPT

Close A
 ↓
TOMBSTONE

Create B
 ↓
same 4-tuple
 ↓
incarnation C29D

Send B1
 ↓
ACCEPT

Release A2
 ↓
A7F9 !== C29D
 ↓
REJECT STALE_INCARNATION

Send B2
 ↓
ACCEPT
```

---

# 91. Retransmission Test

```text
Create B
 ↓
incarnation C29D

Send B1
sequence 200
 ↓
DROP

Retransmit B1
sequence 200
incarnation C29D
 ↓
ACCEPT
```

If B1 was already processed:

```text
DEDUPLICATE
```

---

# 92. Reordering Test

```text
B1 seq 200
B2 seq 201
B3 seq 202
```

Network:

```text
B1
B3
B2
```

Expected:

```text
B1 → ACCEPT

B3 → BUFFER

B2 → ACCEPT

B3 → PROCESS
```

This should NOT be classified as stale.

---

# 93. Duplicate Test

```text
B1
B1
```

Expected:

```text
first B1 → ACCEPT
second B1 → DUPLICATE / DEDUPLICATE
```

---

# 94. Unknown Connection Test

If a packet arrives for an endpoint with no active connection:

```text
→ UNKNOWN_CONNECTION
```

It must not create an active connection automatically.

---

# 95. Dashboard Requirements

The dashboard should show:

### Connection Table

```text
Connection
4-tuple
Incarnation
State
Sequence
```

Example:

```text
Connection B
10.0.0.1:5000 → 10.0.0.2:8080
C29D82F1
ESTABLISHED
seq 201
```

---

# 96. Packet Timeline

Example:

```text
A1 [A7F9] → SENT
A2 [A7F9] → DELAYED
A3 [A7F9] → ACCEPTED

A CLOSED

B1 [C29D] → ACCEPTED

A2 [A7F9] → RELEASED
A2 [A7F9] → REJECTED
Reason: STALE_INCARNATION

B2 [C29D] → ACCEPTED
```

---

# 97. Tombstone Panel

Show:

```text
TOMBSTONE

Tuple:
10.0.0.1:5000 → 10.0.0.2:8080

Old Incarnation:
A7F9

State:
CLOSED

Expires:
T+5s
```

This visually proves that the old incarnation is remembered without blocking reuse.

---

# 98. Metrics Panel

Recommended metrics:

```text
Total Packets
Accepted
Rejected
Stale
Duplicates
Out-of-Order
Buffered
Dropped
Retransmissions
```

Also optionally:

```text
False Accepts
False Rejects
```

when comparing Naive vs PortShadow.

---

# 99. Simulation Controls

Required controls:

```text
Create A
Send Packet
Delay Packet
Close A
Create B
Release Delayed Packet
Run Main Scenario
```

Additional controls:

```text
Drop
Duplicate
Reorder
Retransmit
```

---

# 100. Main "Money Shot"

The most important visual moment should be:

```text
┌──────────────────────────────────────────┐
│ A2 [A7F9]                                │
│ ❌ REJECTED                              │
│ Reason: STALE_INCARNATION                │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ B2 [C29D]                                │
│ ✅ ACCEPTED                              │
│ Reason: CURRENT_INCARNATION              │
└──────────────────────────────────────────┘
```

This demonstrates:

```text
same endpoint
different incarnation
old packet rejected
new packet accepted
```

---

# 101. AI Integration

AI is optional.

If AI is included, it must NOT participate in packet acceptance/rejection.

AI should be a read-only:

```text
Scenario Analyst
```

or:

```text
Explanation Assistant
```

AI receives structured facts such as:

```json
{
  "packetId": "A2",
  "packetIncarnation": "A7F9",
  "activeIncarnation": "C29D",
  "sequenceNumber": 101,
  "decision": "REJECTED",
  "reason": "STALE_INCARNATION"
}
```

AI explains the decision.

---

# 102. AI Trust Boundary

AI MUST NOT:

- accept packets
- reject packets
- mutate transport state
- modify incarnation IDs
- modify tests
- execute arbitrary commands
- override deterministic validation
- control the authoritative simulation state

Correct architecture:

```text
Packet
 ↓
Deterministic Validator
 ↓
ACCEPT / REJECT
 ↓
Event
 ↓
AI Explanation
```

Not:

```text
Packet
 ↓
AI
 ↓
ACCEPT / REJECT
```

---

# 103. Why AI Is Not Used for Packet Decisions

Transport correctness must be deterministic.

AI is probabilistic.

A security-critical packet decision should therefore be based on explicit state:

```text
incarnation
sequence
connection state
```

not natural-language reasoning.

This is also a strong trust-boundary explanation for judges.

---

# 104. Performance Design

Packet validation should be in-memory.

Expected conceptual flow:

```text
packet
 ↓
Map lookup
 ↓
incarnation comparison
 ↓
sequence validation
 ↓
decision
```

Avoid unnecessary database calls.

The simulator should support high connection and packet rates within the limits of the host machine.

Actual performance numbers must be measured rather than invented.

---

# 105. Benchmarking

Phase 12 should measure actual:

```text
packets/second
connections/second
validation latency
memory usage
tombstone cleanup
```

Compare:

```text
Naive validator
vs
PortShadow validator
```

Only publish measured values.

---

# 106. Docker

The project should be containerizable.

Possible services:

```text
frontend
backend
postgres
```

Development:

```text
docker-compose.yml
```

Environment variables should be used for:

```text
DATABASE_URL
PORT
CLIENT_URL
```

Never commit secrets.

---

# 107. Deployment Architecture

Production:

```text
User Browser
     │
     ▼
Vercel
React Frontend
     │
 REST / Socket.IO
     │
     ▼
Render
Node.js + Express
     │
     ▼
Managed PostgreSQL
```

---

# 108. Frontend Deployment

Deploy the React/Vite frontend to:

```text
Vercel
```

Required environment configuration should point API/WebSocket requests to the deployed backend.

---

# 109. Backend Deployment

Deploy Node.js/Express backend to:

```text
Render
```

The backend must expose:

```text
HTTP API
Socket.IO
```

and correctly configure:

```text
CORS
environment variables
database connection
```

---

# 110. Database Deployment

Use a managed PostgreSQL instance.

Prisma should connect using:

```text
DATABASE_URL
```

Do not hard-code credentials.

---

# 111. Environment Variables

Example:

```text
PORT=5000
DATABASE_URL=...
CLIENT_URL=...
```

Create:

```text
.env.example
```

Do not commit:

```text
.env
```

---

# 112. Security Rules

Never:

- hard-code database credentials
- commit API keys
- expose secrets to the frontend
- allow AI to make packet decisions
- trust client-provided connection state
- let stale packets mutate state

---

# 113. Important Semantic Distinction

Do not say:

> "B receives A2."

This can misleadingly imply that B intentionally generated or accepted A2.

Prefer:

> "A packet generated by the previous connection incarnation arrives at the receiver after the endpoint has been reused by B."

Or:

> "The receiver associated with the reused endpoint receives a packet from the previous incarnation."

---

# 114. Correct Terminology

Use:

```text
packet
connection
incarnation
endpoint
4-tuple
sequence number
tombstone
receiver
stale packet
retransmission
duplicate
out-of-order
buffer
```

Avoid using "request" for the transport-layer packet unless the simulation explicitly models an application-layer request.

---

# 115. Important Conceptual Difference

```text
Delayed
≠
Stale
```

A delayed packet can still be valid.

Example:

```text
B packet
current incarnation
delayed 6 seconds
```

It may still be legitimate.

A packet can be:

```text
young
```

but stale if it belongs to an old incarnation.

Therefore:

```text
time ≠ connection identity
```

---

# 116. Key Judge Explanation

Use this explanation:

> "The problem is that an endpoint can be reused while packets from the previous connection are still in flight. The old and new connections can therefore have the same four-tuple. PortShadow assigns every connection lifetime a separate incarnation ID. When a packet arrives, we first identify the active connection and then compare the packet's incarnation with the active incarnation. If they differ, the packet is stale and is rejected before it can modify state. If they match, we continue with normal sequence validation. This lets us reuse the endpoint immediately without accepting delayed traffic from the previous connection."

---

# 117. Strongest One-Line Explanation

> **"PortShadow separates endpoint identity from connection-generation identity."**

---

# 118. Strong Closing Statement

> **"PortShadow doesn't ask the network to stop delivering old packets. It makes the endpoint distinguish which connection incarnation a packet belongs to, so stale traffic can be rejected without globally freezing endpoint reuse."**

---

# 119. Another Strong Explanation

> **"The address tells us where the packet is going, but the incarnation tells us which generation of the connection it belongs to."**

---

# 120. Naive Filter Explanation

Use:

> **"Packet age and packet freshness are not the same thing."**

Then explain:

```text
Old connection packet
age = 1 sec
→ stale

New connection retransmission
age = 6 sec
→ legitimate
```

Therefore an age-only filter is insufficient.

---

# 121. Demo Flow

Recommended 2–3 minute judge demonstration.

## Step 1 — Explain Problem

Use hotel analogy.

```text
Room = endpoint
Stay ID = incarnation
Package = packet
```

## Step 2 — Create Connection A

Show:

```text
10.0.0.1:5000
      ↓
10.0.0.2:8080

Incarnation:
A7F9
```

Run handshake.

## Step 3 — Send A Packets

```text
A1 → ACCEPT
A2 → DELAY
A3 → ACCEPT
```

## Step 4 — Close A

Show:

```text
A CLOSED
```

Then:

```text
TOMBSTONE CREATED
```

## Step 5 — Immediately Create B

Reuse:

```text
10.0.0.1:5000
```

Same destination.

New incarnation:

```text
C29D
```

This proves there is no global long reuse delay.

## Step 6 — Send B1

```text
B1 [C29D]
→ ACCEPTED
```

## Step 7 — Release A2

```text
A2 [A7F9]
```

Active connection:

```text
B [C29D]
```

Comparison:

```text
A7F9 !== C29D
```

Result:

```text
❌ REJECTED
STALE_INCARNATION
```

## Step 8 — Prove B Still Works

Send:

```text
B2 [C29D]
```

Result:

```text
✅ ACCEPTED
```

This proves stale rejection did not break the new connection.

## Step 9 — Demonstrate Retransmission

```text
B1
↓
DROP

B1 retransmission
↓
same incarnation
↓
ACCEPT / DEDUPLICATE
```

## Step 10 — Optional Reordering

Show:

```text
B1
B3
B2
```

and demonstrate:

```text
B3 → BUFFER
```

rather than:

```text
STALE
```

---

# 122. Final Demo Story

```text
A opens
 ↓
A gets incarnation A7F9
 ↓
A sends packets
 ↓
A2 becomes delayed
 ↓
A closes
 ↓
tombstone records A7F9
 ↓
B immediately reuses same endpoint
 ↓
B gets incarnation C29D
 ↓
B packet accepted
 ↓
old A2 arrives
 ↓
A7F9 != C29D
 ↓
A2 rejected
 ↓
B continues working
```

---

# 123. Development Order

Do not start with the dashboard.

Build in this order:

```text
1. Connection model
2. Incarnation generation
3. Packet model
4. Network simulation
5. Packet validation
6. Tombstones
7. Rapid reuse
8. Retransmission
9. Reordering
10. Duplicate handling
11. Tests
12. API
13. WebSocket
14. React dashboard
15. Benchmarks
16. Docker
17. Deployment
```

---

# 124. Core Implementation Priority

The highest-priority files are:

```text
ConnectionManager.js
IncarnationManager.js
PacketValidator.js
SequenceManager.js
TombstoneStore.js
NetworkSimulator.js
RapidReuse.js
stalePacket.test.js
```

The dashboard is secondary to the correctness of these modules.

---

# 125. MVP Acceptance Criteria

The MVP is complete only when all of these work:

```text
[✓] Create connection A
[✓] Generate incarnation A
[✓] Send packet
[✓] Delay packet
[✓] Close A
[✓] Create tombstone
[✓] Immediately reuse same endpoint
[✓] Generate incarnation B
[✓] Accept B packet
[✓] Release old A packet
[✓] Detect incarnation mismatch
[✓] Reject old packet
[✓] Do not mutate B state
[✓] Accept subsequent B packet
```

---

# 126. Strong Hackathon Acceptance Criteria

Add:

```text
[✓] Retransmission
[✓] Duplicate packets
[✓] Out-of-order packets
[✓] Packet loss
[✓] Naive age-based comparison
[✓] Automated tests
[✓] Property-based invariant testing
[✓] Real-time event stream
[✓] Dashboard
```

---

# 127. Final Project Acceptance Criteria

Add:

```text
[✓] REST API
[✓] Socket.IO
[✓] React dashboard
[✓] PostgreSQL
[✓] Prisma
[✓] Metrics
[✓] Benchmarking
[✓] Docker
[✓] Vercel deployment
[✓] Render deployment
[✓] Managed PostgreSQL
[✓] Judge-ready demo
[✓] Documentation
```

---

# 128. Engineering Principles

## Principle 1

Deterministic transport validation must remain independent of AI.

## Principle 2

Incarnation validation occurs before state mutation.

## Principle 3

Tombstones provide bounded historical context.

## Principle 4

Tombstones must not block immediate endpoint reuse.

## Principle 5

Sequence validation occurs after incarnation validation.

## Principle 6

Out-of-order packets are not automatically stale.

## Principle 7

Retransmissions belonging to the active incarnation remain valid.

## Principle 8

Packet age alone is insufficient for stale detection.

## Principle 9

Runtime packet decisions should use in-memory state.

## Principle 10

PostgreSQL is for persistence, history, analytics, and benchmarking.

---

# 129. Do Not Overbuild

Do not attempt to implement the complete TCP protocol.

The objective is a focused simulation of:

```text
endpoint reuse
+
delayed packets
+
connection incarnations
+
stale-packet isolation
```

TCP-like features should only be simulated where they help demonstrate the problem.

---

# 130. Scope Boundary

PortShadow is:

```text
software simulation
transport-layer concept demonstration
stale-packet isolation system
connection incarnation simulator
network chaos simulator
verification/demo platform
```

PortShadow is NOT:

```text
a real TCP stack
a kernel network implementation
a replacement for TCP
a packet firewall
an IDS
a production network stack
```

---

# 131. Final Architecture Summary

```text
                ┌───────────────────┐
                │ React + JS        │
                │ Vite              │
                │ Tailwind          │
                │ React Flow        │
                │ Zustand           │
                └─────────┬─────────┘
                          │
                    REST / Socket.IO
                          │
                ┌─────────▼─────────┐
                │ Node.js + Express │
                │ JavaScript        │
                └─────────┬─────────┘
                          │
              ┌───────────▼───────────┐
              │ PortShadow Core       │
              │                       │
              │ ConnectionManager      │
              │ IncarnationManager     │
              │ PacketValidator       │
              │ SequenceManager       │
              │ TombstoneStore        │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │ Network Simulator     │
              │                       │
              │ Delay                 │
              │ Reorder               │
              │ Duplicate             │
              │ Drop                  │
              └───────────┬───────────┘
                          │
                    In-Memory State
                          │
              ┌───────────▼───────────┐
              │ Event / Metrics       │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │ PostgreSQL + Prisma   │
              └───────────────────────┘
```

---

# 132. Final Core Algorithm

```text
PACKET ARRIVES
      │
      ▼
Construct / identify 4-tuple
      │
      ▼
Find active connection
      │
      ├── NOT FOUND
      │      │
      │      ▼
      │ UNKNOWN_CONNECTION
      │
      ▼
Compare packet.incarnationId
with activeConnection.incarnationId
      │
      ├── DIFFERENT
      │      │
      │      ▼
      │ STALE_INCARNATION
      │
      │      └── DO NOT MUTATE STATE
      │
      ▼
Same incarnation
      │
      ▼
Validate sequence
      │
      ├── expected
      │      ↓
      │   ACCEPT
      │
      ├── already seen
      │      ↓
      │   DUPLICATE / DEDUPLICATE
      │
      └── future/out-of-order
             ↓
          BUFFER
```

---

# 133. The Central Invariant

Everything in the implementation should preserve this:

```text
OLD INCARNATION
      │
      │ packet arrives
      ▼
ACTIVE ENDPOINT
      │
      ▼
INCARNATION MISMATCH
      │
      ▼
REJECT
      │
      ▼
NO ACTIVE STATE MUTATION
```

---

# 134. Final Project Definition

PortShadow demonstrates that safe endpoint reuse does not require blindly waiting for every old packet to disappear.

Instead, the simulator explicitly tracks connection generations.

When a packet arrives:

```text
Where is it going?
        ↓
4-tuple

Which connection generation created it?
        ↓
incarnationId

Is its transport state valid?
        ↓
sequence validation
```

This gives:

```text
Fast endpoint reuse
+
stale packet isolation
+
legitimate retransmission support
+
reordering support
+
duplicate handling
+
deterministic verification
```

The central design principle is:

> **Do not confuse endpoint identity with connection incarnation identity.**

And the central safety property is:

> **A packet from an earlier incarnation must never modify the state of the active incarnation.**
