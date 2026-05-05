import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "../src/app";

const token = jwt.sign(
  {
    sub: "00000000-0000-0000-0000-000000000001",
    email: "admin@example.com",
    role: "admin"
  },
  process.env.JWT_ACCESS_SECRET ?? "dev_access_secret_change_me"
);

describe("Users API", () => {
  it("blocks unauthenticated list", async () => {
    const response = await request(app).get("/api/v1/users");
    expect(response.status).toBe(401);
  });

  it("validates create user payload", async () => {
    const response = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "not-an-email", role: "wrong" });

    expect(response.status).toBe(400);
  });
});
