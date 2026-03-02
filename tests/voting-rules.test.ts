import assert from "node:assert/strict";
import test from "node:test";
import { validateBallotSelections } from "../lib/voting-rules.ts";

const positions = [
  { id: 1, maxWinners: 1 },
  { id: 2, maxWinners: 2 },
];

const candidates = [
  { id: 10, positionId: 1 },
  { id: 11, positionId: 1 },
  { id: 20, positionId: 2 },
  { id: 21, positionId: 2 },
  { id: 22, positionId: 2 },
];

test("accepts valid selections within per-position limits", () => {
  const result = validateBallotSelections(
    [
      { positionId: 1, candidateIds: [10] },
      { positionId: 2, candidateIds: [20, 21] },
    ],
    positions,
    candidates,
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.selections.length, 3);
  }
});

test("rejects over-selection for a position", () => {
  const result = validateBallotSelections(
    [
      { positionId: 1, candidateIds: [10, 11] },
      { positionId: 2, candidateIds: [20] },
    ],
    positions,
    candidates,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "over-selection");
    assert.equal(result.positionId, 1);
  }
});

test("rejects candidate-position mismatch", () => {
  const result = validateBallotSelections(
    [
      { positionId: 1, candidateIds: [20] },
      { positionId: 2, candidateIds: [21] },
    ],
    positions,
    candidates,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "candidate-position-mismatch");
    assert.equal(result.positionId, 1);
    assert.equal(result.candidateId, 20);
  }
});

test("rejects duplicate candidate in the same position payload", () => {
  const result = validateBallotSelections(
    [{ positionId: 2, candidateIds: [20, 20] }],
    positions,
    candidates,
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "duplicate-candidate");
    assert.equal(result.positionId, 2);
    assert.equal(result.candidateId, 20);
  }
});
