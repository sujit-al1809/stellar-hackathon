/**
 * Create Demo Users for StratFlow
 *
 * Run this in browser console to create demo accounts:
 * - Expert account
 * - Trader account
 * - Verifier account
 *
 * Usage:
 *   1. Make sure dev server is running (npm run dev)
 *   2. Open http://localhost:3000/signup
 *   3. Open browser console (F12)
 *   4. Copy and paste this entire script
 *   5. Press Enter
 */

const DEMO_USERS = [
  {
    name: "Bob Expert",
    email: "expert@stratflow.io",
    password: "demo123",
    role: "expert"
  },
  {
    name: "Alice Trader",
    email: "trader@stratflow.io",
    password: "demo123",
    role: "trader"
  },
  {
    name: "Charlie Verifier",
    email: "verifier@stratflow.io",
    password: "demo123",
    role: "verifier"
  }
];

async function createDemoUsers() {
  console.log("🚀 Creating demo users...\n");

  for (const user of DEMO_USERS) {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Created ${user.role}: ${user.email}`);
      } else if (response.status === 409) {
        console.log(`⚠️  ${user.role} already exists: ${user.email}`);
      } else {
        console.error(`❌ Failed to create ${user.role}:`, data.error);
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.role}:`, error);
    }
  }

  console.log("\n🎉 Demo users ready!");
  console.log("\n📝 Login credentials:");
  console.log("━".repeat(50));
  DEMO_USERS.forEach(user => {
    console.log(`${user.role.toUpperCase().padEnd(10)} | ${user.email.padEnd(25)} | demo123`);
  });
  console.log("━".repeat(50));
  console.log("\n✨ Go to /login and use any of these accounts!");
}

// Run it
createDemoUsers();
