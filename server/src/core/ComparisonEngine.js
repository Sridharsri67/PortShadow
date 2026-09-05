import { Packet, PACKET_STATUS, REJECTION_REASONS } from "../models/Packet.js";
import { packetValidator as defaultPortShadowValidator } from "./PacketValidator.js";
import { naiveValidator as defaultNaiveValidator } from "./NaiveValidator.js";
import { connectionManager as defaultConnectionManager } from "./ConnectionManager.js";

/**
 * ComparisonEngine runs identical transport traffic through both Naive (age-only)
 * and PortShadow (incarnation-aware) validation engines side-by-side.
 * 
 * Accurately measures and pinpoints security vulnerabilities (False Acceptances)
 * and reliability failures (False Rejections) caused by naive time-only filtering.
 */
export class ComparisonEngine {
  /**
   * @param {import("./PacketValidator.js").PacketValidator} [portShadowValidator]
   * @param {import("./NaiveValidator.js").NaiveValidator} [naiveValidator]
   * @param {import("./ConnectionManager.js").ConnectionManager} [connectionMgr]
   */
  constructor(
    portShadowValidator = defaultPortShadowValidator,
    naiveValidator = defaultNaiveValidator,
    connectionMgr = defaultConnectionManager
  ) {
    this.portShadowValidator = portShadowValidator;
    this.naiveValidator = naiveValidator;
    this.connectionManager = connectionMgr;
  }

  /**
   * Compare a single packet against both validation engines.
   * Ground truth is determined by PortShadow's incarnation-aware decision.
   *
   * @param {import("../models/Packet.js").Packet} packet
   * @param {number} [nowMs]
   * @param {import("./ConnectionManager.js").ConnectionManager} [connMgr]
   */
  compareSinglePacket(packet, nowMs = Date.now(), connMgr = this.connectionManager) {
    const cm = connMgr || this.connectionManager;

    // Clone packet for independent evaluation to prevent status contamination
    const psPacket = new Packet({ ...packet.toJSON() });
    const naivePacket = new Packet({ ...packet.toJSON() });

    const psResult = this.portShadowValidator.validateAndProcess(psPacket, cm);
    const naiveResult = this.naiveValidator.validateAndProcess(naivePacket, cm, nowMs);

    let discrepancyType = null;
    let explanation = "Both validation engines produced identical results.";

    const psAccepted = psResult.status === PACKET_STATUS.ACCEPTED || psResult.status === PACKET_STATUS.BUFFERED || psResult.status === PACKET_STATUS.DUPLICATE;
    const naiveAccepted = naiveResult.status === PACKET_STATUS.ACCEPTED;

    if (psResult.status === PACKET_STATUS.REJECTED && psResult.reason === REJECTION_REASONS.STALE_INCARNATION && naiveAccepted) {
      discrepancyType = "FALSE_ACCEPTANCE";
      explanation = "SECURITY VULNERABILITY: Naive age filter accepted a stale packet from an earlier connection incarnation into the active connection state!";
    } else if (psAccepted && naiveResult.status === PACKET_STATUS.REJECTED && naiveResult.reason === "TOO_OLD") {
      discrepancyType = "FALSE_REJECTION";
      explanation = "RELIABILITY FAILURE: Naive age filter discarded a legitimate packet belonging to the current connection because its transit time exceeded the arbitrary 5s threshold.";
    } else if (psResult.status !== naiveResult.status) {
      discrepancyType = "STATUS_MISMATCH";
      explanation = `Status mismatch: PortShadow=${psResult.status} (${psResult.reason}), Naive=${naiveResult.status} (${naiveResult.reason}).`;
    }

    return {
      packetId: packet.packetId,
      sequenceNumber: packet.sequenceNumber,
      incarnationId: packet.incarnationId,
      createdAt: packet.createdAt,
      ageMs: naiveResult.ageMs,
      portShadow: psResult,
      naive: naiveResult,
      discrepancyType,
      explanation
    };
  }

  /**
   * Run comparison across a series of packets.
   *
   * @param {Array<{ packet: import("../models/Packet.js").Packet, nowMs?: number }>} items
   * @param {import("./ConnectionManager.js").ConnectionManager} [connMgr]
   */
  evaluateComparisonSet(items, connMgr = this.connectionManager) {
    const results = [];
    let falseAcceptancesCount = 0;
    let falseRejectionsCount = 0;
    let psAcceptedCount = 0;
    let psRejectedCount = 0;
    let naiveAcceptedCount = 0;
    let naiveRejectedCount = 0;

    for (const item of items) {
      const pkt = item.packet || item;
      const nowMs = item.nowMs || Date.now();
      const comp = this.compareSinglePacket(pkt, nowMs, connMgr);
      results.push(comp);

      if (comp.portShadow.status === PACKET_STATUS.ACCEPTED) psAcceptedCount++;
      else psRejectedCount++;

      if (comp.naive.status === PACKET_STATUS.ACCEPTED) naiveAcceptedCount++;
      else naiveRejectedCount++;

      if (comp.discrepancyType === "FALSE_ACCEPTANCE") falseAcceptancesCount++;
      if (comp.discrepancyType === "FALSE_REJECTION") falseRejectionsCount++;
    }

    return {
      totalPackets: results.length,
      portShadow: {
        acceptedCount: psAcceptedCount,
        rejectedCount: psRejectedCount,
        falseAcceptancesCount: 0,
        falseRejectionsCount: 0
      },
      naive: {
        acceptedCount: naiveAcceptedCount,
        rejectedCount: naiveRejectedCount,
        falseAcceptancesCount,
        falseRejectionsCount
      },
      discrepanciesCount: falseAcceptancesCount + falseRejectionsCount,
      details: results
    };
  }
}

export const comparisonEngine = new ComparisonEngine();
