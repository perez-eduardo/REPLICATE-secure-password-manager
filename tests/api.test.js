const request = require("supertest");

const API_URL = process.env.API_BASE_URL || "http://localhost:3001";
const INTERNAL_SECRET = process.env.TOTP_INTERNAL_SECRET;

if (!INTERNAL_SECRET) {
  throw new Error("TOTP_INTERNAL_SECRET env var is required to run these tests");
}

describe("API happy path", () => {
  const testEmail = `apitest-${Date.now()}@example.com`;
  const testPassword = "TestPass123!";

  let userId;
  let jwtToken;
  let credentialId;

  test("POST /api/auth/register creates a new user", async () => {
    const res = await request(API_URL)
      .post("/api/auth/register")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("User created");
    expect(res.body).toHaveProperty("userId");

    userId = res.body.userId;
  });

  test("POST /api/auth/login with valid credentials prompts MFA setup", async () => {
    const res = await request(API_URL)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.requireMFASetup).toBe(true);
    expect(res.body.userId).toBe(userId);
  });

  test("POST /api/internal/users/:userId/complete-mfa returns a JWT", async () => {
    const res = await request(API_URL)
      .post(`/api/internal/users/${userId}/complete-mfa`)
      .set("x-internal-secret", INTERNAL_SECRET);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");

    jwtToken = res.body.token;
  });

  test("POST /api/credentials creates a credential", async () => {
    const res = await request(API_URL)
      .post("/api/credentials")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({
        title: "Test Site",
        website: "https://example.com",
        category: "personal",
        encryptedData: {
          ciphertext: "fakeCiphertextBase64==",
          iv: "fakeIvBase64==",
          salt: "fakeSaltBase64==",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.title).toBe("Test Site");
    expect(res.body.category).toBe("personal");
    expect(res.body.encryptedData.ciphertext).toBe("fakeCiphertextBase64==");

    credentialId = res.body._id;
  });

  test("GET /api/credentials returns a list including the new credential", async () => {
    const res = await request(API_URL)
      .get("/api/credentials")
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((c) => c._id === credentialId)).toBe(true);
  });

  test("GET /api/credentials/:id returns the credential", async () => {
    const res = await request(API_URL)
      .get(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(credentialId);
    expect(res.body.title).toBe("Test Site");
  });

  test("PUT /api/credentials/:id updates the credential", async () => {
    const res = await request(API_URL)
      .put(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`)
      .send({ title: "Updated Test Site" });

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(credentialId);
    expect(res.body.title).toBe("Updated Test Site");
  });

  test("DELETE /api/credentials/:id removes the credential", async () => {
    const res = await request(API_URL)
      .delete(`/api/credentials/${credentialId}`)
      .set("Authorization", `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Deleted successfully");
  });
});
