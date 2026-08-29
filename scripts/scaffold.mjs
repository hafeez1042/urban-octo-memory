#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "../..");
const input = process.argv[2];

if (!input) {
  console.error("Usage: pnpm scaffold <EntityName>");
  process.exit(1);
}

const pascalName = input
  .replace(/[-_](.)/g, (_, character) => character.toUpperCase())
  .replace(/^(.)/, (_, character) => character.toUpperCase());
const camelName = pascalName[0].toLowerCase() + pascalName.slice(1);
const snakeName = pascalName.replace(/[A-Z]/g, (character, index) => `${index ? "_" : ""}${character.toLowerCase()}`);
const pluralName = `${snakeName}s`;
const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

const files = {
  [`packages/types/src/schema/${snakeName}.ts`]: `import { IBaseAttributes } from "../types.sql";\n\nexport interface I${pascalName} extends IBaseAttributes<string> {\n  // Add domain fields here.\n}\n`,
  [`services/core/migrations/${timestamp}-create-${pluralName}.cjs`]: `"use strict";\n\nmodule.exports = {\n  async up(queryInterface, Sequelize) {\n    await queryInterface.createTable("${pluralName}", {\n      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },\n      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },\n      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },\n    });\n  },\n  async down(queryInterface) {\n    await queryInterface.dropTable("${pluralName}");\n  },\n};\n`,
  [`services/core/src/models/${snakeName}.model.ts`]: `import { DataTypes, Model, Optional } from "sequelize";\nimport type { I${pascalName} } from "@repo/types/lib/schema/${snakeName}";\nimport sequelize from "../config/database";\n\ntype ${pascalName}CreationAttributes = Optional<I${pascalName}, "id" | "created_at" | "updated_at">;\n\nexport class ${pascalName} extends Model<I${pascalName}, ${pascalName}CreationAttributes> implements I${pascalName} {\n  declare id: string;\n  declare created_at: Date;\n  declare updated_at: Date;\n}\n\n${pascalName}.init(\n  {\n    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },\n  },\n  { sequelize, tableName: "${pluralName}", underscored: true },\n);\n`,
  [`services/core/src/repositories/${snakeName}.repository.ts`]: `import { BaseRepository } from "@repo/backend/lib/repositories/BaseRepository.sequelize";\nimport type { I${pascalName} } from "@repo/types/lib/schema/${snakeName}";\nimport { ${pascalName} } from "../models/${snakeName}.model";\n\nexport class ${pascalName}Repository extends BaseRepository<I${pascalName}, string> {\n  constructor() {\n    super(${pascalName} as never);\n  }\n\n  getSearchQuery = () => ({});\n}\n\nexport const ${camelName}Repository = new ${pascalName}Repository();\n`,
  [`services/core/src/services/${snakeName}.service.ts`]: `import { BaseServices } from "@repo/backend/lib/services/BaseServices";\nimport type { I${pascalName} } from "@repo/types/lib/schema/${snakeName}";\nimport { ${camelName}Repository } from "../repositories/${snakeName}.repository";\n\nexport class ${pascalName}Service extends BaseServices<I${pascalName}, string> {\n  constructor() {\n    super(${camelName}Repository);\n  }\n}\n\nexport const ${camelName}Service = new ${pascalName}Service();\n`,
  [`services/core/src/controllers/${snakeName}.controller.ts`]: `import { BaseController } from "@repo/backend/lib/controller/BaseController";\nimport type { I${pascalName} } from "@repo/types/lib/schema/${snakeName}";\nimport { ${camelName}Service } from "../services/${snakeName}.service";\n\nexport class ${pascalName}Controller extends BaseController<I${pascalName}, string> {\n  constructor() {\n    super(${camelName}Service, "uuid");\n  }\n}\n\nexport const ${camelName}Controller = new ${pascalName}Controller();\n`,
  [`services/core/src/routes/${snakeName}.routes.ts`]: `import { Router } from "express";\nimport { ${camelName}Controller } from "../controllers/${snakeName}.controller";\n\nexport const ${camelName}Routes: Router = Router();\n\n${camelName}Routes.get("/${pluralName}", ${camelName}Controller.getAll);\n${camelName}Routes.get("/${pluralName}/:id", ${camelName}Controller.getById);\n${camelName}Routes.post("/${pluralName}", ${camelName}Controller.create);\n${camelName}Routes.patch("/${pluralName}/:id", ${camelName}Controller.update);\n${camelName}Routes.delete("/${pluralName}/:id", ${camelName}Controller.delete);\n`,
};

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = join(root, relativePath);
  if (existsSync(filePath)) {
    console.log(`SKIP ${relativePath}`);
    continue;
  }
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf8");
  console.log(`CREATE ${relativePath}`);
}

console.log(`Register ${camelName}Routes in services/core/src/routes/index.ts before using the API.`);
