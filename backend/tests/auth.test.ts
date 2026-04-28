import request from "supertest";
import { app } from "../src/app";

describe("Auth API", () => {
  it("rejects invalid login payload", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({ email: "bad" });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
