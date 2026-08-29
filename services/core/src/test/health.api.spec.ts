import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildApp } from "../app";

describe("health endpoint", () => {
  it("returns an operational status", async () => {
    const response = await request(buildApp())
      .get("/health")
      .set("X-Request-Id", "test-request-id");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBe("test-request-id");
  });
});
