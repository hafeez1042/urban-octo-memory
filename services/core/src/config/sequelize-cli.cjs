require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for Sequelize CLI commands.");
}

module.exports = {
  development: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
  test: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
  production: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
};
