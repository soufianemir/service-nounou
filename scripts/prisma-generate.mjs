import { spawnSync } from "node:child_process";

const schema = "prisma/schema.prisma";
const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: true
});

process.exit(result.status ?? 1);
