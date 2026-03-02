type PrismaLikeError = {
  name?: unknown;
  code?: unknown;
};

export function isPrismaKnownRequestError(
  error: unknown,
  code?: string,
): error is PrismaLikeError & { code: string } {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as PrismaLikeError;
  if (candidate.name !== "PrismaClientKnownRequestError") {
    return false;
  }

  if (typeof candidate.code !== "string") {
    return false;
  }

  return code ? candidate.code === code : true;
}
