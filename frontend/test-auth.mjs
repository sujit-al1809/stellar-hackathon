// Quick auth test
async function test() {
  const BASE = "http://localhost:3000";

  // 1. Demo login
  console.log("=== LOGIN (demo admin) ===");
  let r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@stratflow.io", password: "demo123" }),
  });
  let d = await r.json();
  console.log("Status:", r.status);
  console.log("Response:", JSON.stringify(d, null, 2));
  const cookie = r.headers.get("set-cookie");
  console.log("Cookie set:", !!cookie);
  console.log();

  // 2. /me with cookie
  console.log("=== GET /me ===");
  r = await fetch(`${BASE}/api/auth/me`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  d = await r.json();
  console.log("Status:", r.status);
  console.log("User:", JSON.stringify(d, null, 2));
  console.log();

  // 3. Signup
  console.log("=== SIGNUP ===");
  r = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Hackathon Tester",
      email: `tester-${Date.now()}@test.com`,
      password: "test12345",
      role: "executor",
    }),
  });
  d = await r.json();
  console.log("Status:", r.status);
  console.log("Response:", JSON.stringify(d, null, 2));
  console.log();

  // 4. Bad password
  console.log("=== BAD PASSWORD ===");
  r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@stratflow.io", password: "wrong" }),
  });
  d = await r.json();
  console.log("Status:", r.status, JSON.stringify(d));
  console.log();

  console.log("=== ALL DONE ===");
}

test().catch(console.error);
