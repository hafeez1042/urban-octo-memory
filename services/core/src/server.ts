import { buildApp } from "./app";
import env from "./config/env";

const app = buildApp();

app.listen(env.PORT, () => {
  console.log(`API listening on port ${env.PORT}`);
});
