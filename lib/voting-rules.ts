export type PositionRule = {
  id: number;
  maxWinners: number;
};

export type CandidateRule = {
  id: number;
  positionId: number;
};

export type PositionSelection = {
  positionId: number;
  candidateIds: number[];
};

export type NormalizedSelection = {
  positionId: number;
  candidateId: number;
};

export type BallotValidationErrorCode =
  | "unknown-position"
  | "duplicate-candidate"
  | "invalid-candidate"
  | "candidate-position-mismatch"
  | "over-selection";

export type BallotValidationResult =
  | {
      ok: true;
      selections: NormalizedSelection[];
    }
  | {
      ok: false;
      code: BallotValidationErrorCode;
      positionId?: number;
      candidateId?: number;
    };

const POSITION_FIELD_PREFIX = "position-";

export function extractSelectionsFromFormData(formData: FormData): PositionSelection[] {
  const map = new Map<number, number[]>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith(POSITION_FIELD_PREFIX)) {
      continue;
    }

    const positionIdText = key.slice(POSITION_FIELD_PREFIX.length);
    const positionId = Number(positionIdText);
    const candidateId = Number(value);
    if (!Number.isInteger(positionId) || positionId <= 0) {
      continue;
    }

    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      continue;
    }

    const previous = map.get(positionId) ?? [];
    previous.push(candidateId);
    map.set(positionId, previous);
  }

  return [...map.entries()].map(([positionId, candidateIds]) => ({
    positionId,
    candidateIds,
  }));
}

export function validateBallotSelections(
  selections: PositionSelection[],
  positions: PositionRule[],
  candidates: CandidateRule[],
): BallotValidationResult {
  const positionById = new Map(positions.map((position) => [position.id, position]));
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const normalized: NormalizedSelection[] = [];

  for (const selection of selections) {
    const position = positionById.get(selection.positionId);
    if (!position) {
      return {
        ok: false,
        code: "unknown-position",
        positionId: selection.positionId,
      };
    }

    const seenCandidateIds = new Set<number>();
    for (const candidateId of selection.candidateIds) {
      if (seenCandidateIds.has(candidateId)) {
        return {
          ok: false,
          code: "duplicate-candidate",
          positionId: selection.positionId,
          candidateId,
        };
      }
      seenCandidateIds.add(candidateId);
    }

    if (seenCandidateIds.size > position.maxWinners) {
      return {
        ok: false,
        code: "over-selection",
        positionId: selection.positionId,
      };
    }

    for (const candidateId of seenCandidateIds) {
      const candidate = candidateById.get(candidateId);
      if (!candidate) {
        return {
          ok: false,
          code: "invalid-candidate",
          positionId: selection.positionId,
          candidateId,
        };
      }

      if (candidate.positionId !== selection.positionId) {
        return {
          ok: false,
          code: "candidate-position-mismatch",
          positionId: selection.positionId,
          candidateId,
        };
      }

      normalized.push({
        positionId: selection.positionId,
        candidateId,
      });
    }
  }

  return { ok: true, selections: normalized };
}
