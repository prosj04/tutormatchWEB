import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const PUBLIC_QUESTION_IMAGE_PATTERN =
  /https?:\/\/[^/]+\/storage\/v1\/object\/public\/question-images\/([^?#\s]+)(?:[?#][^\s]*)?/g;

function toPrivateProxyUrl(url) {
  return url.replace(PUBLIC_QUESTION_IMAGE_PATTERN, (_match, rawPath) => {
    return `/api/question-images/${decodeURIComponent(rawPath)}`;
  });
}

async function migrateModel({ label, delegate }) {
  const rows = await delegate.findMany({
    where: {
      imageUrl: {
        contains: "/storage/v1/object/public/question-images/",
      },
    },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  const changes = rows
    .map((row) => ({
      id: row.id,
      before: row.imageUrl,
      after: toPrivateProxyUrl(row.imageUrl ?? ""),
    }))
    .filter((row) => row.before && row.before !== row.after);

  console.log(`${label}.imageUrl: ${changes.length} row(s)`);
  for (const change of changes) {
    console.log(`- ${change.id}: ${change.before} -> ${change.after}`);
  }

  if (apply) {
    for (const change of changes) {
      await delegate.update({
        where: { id: change.id },
        data: { imageUrl: change.after },
      });
    }
  }

  return changes.length;
}

async function main() {
  const total =
    (await migrateModel({ label: "QuestionMessage", delegate: prisma.questionMessage })) +
    (await migrateModel({ label: "Question", delegate: prisma.question }));

  console.log(apply ? `Applied ${total} update(s).` : `Dry run only. Re-run with --apply to update ${total} row(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
