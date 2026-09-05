# 🔄 Complete Execution & Telemetry Flow Guide — PortShadow

This document provides step-by-step visual and operational flow diagrams for packet handling, connection state transitions, network simulation, and stale incarnation isolation.

---

## 1. Connection Lifecycle & Incarnation Allocation Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as Client / API Caller
    participant CM as ConnectionManager
    participant IM as IncarnationManager
    participant Conn as Connection Entity

    App->>CM: createConnection({ sourceIp, sourcePort, destinationIp, destinationPort })
    CM->>CM: Assert 4-Tuple Not Currently Active
    CM->>IM: createIncarnation()
    IM->>IM: Generate 128-bit UUID via crypto.randomUUID()
    IM-->>CM: Incarnation Entity (incarnationId)
    CM->>Conn: Instantiate Connection (state: NEW, sequence: 100)
    Conn->>Conn: transitionTo(CONNECTING) -> transitionTo(ESTABLISHED)
    CM->>CM: Store in activeConnections Map
    CM-->>App: Return Active Connection Details
```

---

## 2. Packet Generation & Sequence Assignment Flow

```mermaid
sequenceDiagram
    autonumber
    participant App as Client / API Caller
    participant PE as PacketEngine
    participant SM as SequenceManager
    participant Conn as Active Connection

    App->>PE: createPacket({ connectionId, payload })
    PE->>Conn: Lookup Active Connection
    PE->>SM: getNextSequenceNumber(connectionId)
    SM-->>PE: Return Incremented Sequence (e.g. 100 -> 101)
    PE->>PE: Inherit connection.incarnationId & 4-Tuple
    PE->>PE: Instantiate Packet (status: CREATED)
    PE-->>App: Return Created Packet Instance
```

---

## 3. Network Simulation Pipeline Flow

```mermaid
flowchart TD
    Start([Packet Submitted to NetworkSimulator]) --> Decision{Transmission Options}

    Decision -- Drop Requested --> DropEngine["DropEngine.dropPacket()"]
    DropEngine --> SetDropped["Set Status: DROPPED"] --> Finish([Log in Transit History])

    Decision -- Duplicate Requested --> DupEngine["DuplicateEngine.duplicatePacket()"]
    DupEngine --> CreateDup["Create Twin Packet Copy (packetId-DUP)<br/>Retain Identical Incarnation & Sequence"] --> DelayCheck

    Decision -- Normal / Delay --> DelayCheck{delayMs > 0?}

    DelayCheck -- Yes --> DelayEngine["DelayEngine.delayPacket()"]
    DelayEngine --> QueueDelay["Set Status: DELAYED<br/>Push to Delayed Queue"] --> Finish

    DelayCheck -- No --> DirectSend["Set Status: SENT"] --> Deliver([Submit to Receiver Pipeline])
```

---

## 4. Receiver Incarnation Isolation & Stale Packet Rejection Flow

```mermaid
flowchart TD
    Arrive([Packet Arrives at Receiver Endpoint]) --> Step1{"1. Lookup Active Connection by 4-Tuple"}

    Step1 -- No Connection Found --> Reject1["❌ REJECT PACKET<br/>Reason: UNKNOWN_CONNECTION"]

    Step1 -- Active Connection Found --> Step2{"2. Compare Incarnation IDs<br/>(packet.incarnationId === active.incarnationId)"}

    Step2 -- Mismatch (A7F9 !== C29D) --> Reject2["❌ REJECT PACKET<br/>Reason: STALE_INCARNATION<br/>(Log Metric, Do Not Mutate State)"]

    Step2 -- Match (C29D === C29D) --> Step3{"3. Sequence Number Validation"}

    Step3 -- Already Accepted Sequence --> MarkDup["⚠️ MARK DUPLICATE<br/>(Deduplicate)"]
    Step3 -- Future Out-of-Order Sequence --> Buffer["⏳ BUFFER PACKET<br/>(Reorder Queue)"]
    Step3 -- Expected Next Sequence --> Accept["✅ ACCEPT PACKET<br/>(Update Receiver State & Buffer)"]
```

---

## 5. Rapid Endpoint Reuse Scenario Execution Flow

```text
Time  Event Description                                     Incarnation ID   Status
──────────────────────────────────────────────────────────────────────────────────────
T1    Connection A Created (10.0.0.1:5000 -> 8080)        A7F91C2D         ESTABLISHED
T2    Packet A1 Sent & Received                             A7F91C2D         ACCEPTED
T3    Packet A2 Sent (Held in DelayEngine for 5s)           A7F91C2D         DELAYED
T4    Packet A3 Sent & Received                             A7F91C2D         ACCEPTED
T5    Connection A Closed (4-Tuple Freed, Tombstone Saved)  A7F91C2D         CLOSED
T6    Connection B Created on EXACT SAME 4-Tuple            C29D82F1         ESTABLISHED
T7    Packet B1 Sent & Received                             C29D82F1         ACCEPTED
T8    Delayed Packet A2 Released by DelayEngine             A7F91C2D         ❌ REJECTED (STALE)
T9    Packet B2 Sent & Received                             C29D82F1         ACCEPTED
```
