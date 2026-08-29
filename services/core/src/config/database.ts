import { Sequelize } from "sequelize";
import env from "./env";

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required before initializing Sequelize.");
}

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

export default sequelize;
