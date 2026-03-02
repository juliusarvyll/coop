-- Enforce Position.maxWinners >= 1 at database level.
ALTER TABLE "Position"
ADD CONSTRAINT "Position_maxWinners_check" CHECK ("maxWinners" >= 1);

-- Ensure selected candidate belongs to the specified position
-- and enforce max winners per position per ballot.
CREATE OR REPLACE FUNCTION enforce_ballot_selection_rules()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
  allowed_count INTEGER;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "Candidate" c
    WHERE c."id" = NEW."candidateId"
      AND c."positionId" = NEW."positionId"
  ) THEN
    RAISE EXCEPTION 'Candidate does not belong to selected position';
  END IF;

  SELECT COUNT(*)
  INTO existing_count
  FROM "BallotSelection" bs
  WHERE bs."ballotId" = NEW."ballotId"
    AND bs."positionId" = NEW."positionId";

  SELECT p."maxWinners"
  INTO allowed_count
  FROM "Position" p
  WHERE p."id" = NEW."positionId";

  IF existing_count >= allowed_count THEN
    RAISE EXCEPTION 'Exceeded max winners for position';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "BallotSelection_insert_guard"
BEFORE INSERT ON "BallotSelection"
FOR EACH ROW
EXECUTE FUNCTION enforce_ballot_selection_rules();

-- Block ballot edits/deletes after submission.
CREATE OR REPLACE FUNCTION block_ballot_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ballot records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Ballot_block_update"
BEFORE UPDATE ON "Ballot"
FOR EACH ROW
EXECUTE FUNCTION block_ballot_mutations();

CREATE TRIGGER "Ballot_block_delete"
BEFORE DELETE ON "Ballot"
FOR EACH ROW
EXECUTE FUNCTION block_ballot_mutations();

-- Block ballot selection edits/deletes after submission.
CREATE OR REPLACE FUNCTION block_ballot_selection_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ballot selections are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "BallotSelection_block_update"
BEFORE UPDATE ON "BallotSelection"
FOR EACH ROW
EXECUTE FUNCTION block_ballot_selection_mutations();

CREATE TRIGGER "BallotSelection_block_delete"
BEFORE DELETE ON "BallotSelection"
FOR EACH ROW
EXECUTE FUNCTION block_ballot_selection_mutations();
