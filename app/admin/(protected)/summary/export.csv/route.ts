import { isAdminAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeCsvCell(value: string | number | boolean): string {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { prisma } = await import("@/lib/prisma");

  const positions = await prisma.position.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: {
      candidates: {
        orderBy: [{ name: "asc" }],
        include: {
          _count: {
            select: {
              selections: true,
            },
          },
        },
      },
    },
  });

  const lines: string[] = [];
  lines.push("Position,Candidate,Votes,MaxWinners,IsWinnerSlot");

  for (const position of positions) {
    const ranked = [...position.candidates].sort((left, right) => {
      const voteDiff = right._count.selections - left._count.selections;
      if (voteDiff !== 0) {
        return voteDiff;
      }
      return left.name.localeCompare(right.name);
    });

    const winnerIds = new Set(
      ranked.slice(0, Math.max(0, position.maxWinners)).map((candidate) => candidate.id),
    );

    for (const candidate of ranked) {
      lines.push(
        [
          escapeCsvCell(position.name),
          escapeCsvCell(candidate.name),
          escapeCsvCell(candidate._count.selections),
          escapeCsvCell(position.maxWinners),
          escapeCsvCell(winnerIds.has(candidate.id)),
        ].join(","),
      );
    }
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="coop-voting-tally.csv"`,
      "cache-control": "no-store",
    },
  });
}
