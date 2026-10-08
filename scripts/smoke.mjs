import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.argv[2] || "http://127.0.0.1:5173";
async function request(path, method = "GET", body, token, status = 200) {
  const response = await fetch(base + "/api/v1" + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  assert.equal(response.status, status, `${method} ${path}: ${text}`);
  return text ? JSON.parse(text) : null;
}
const page = await fetch(base, { signal: AbortSignal.timeout(15000) });
assert.equal(page.status, 200);
assert.match(await page.text(), /id="root"/);
assert.equal((await request("/health")).status, "ok");
for (const avatar of ["demo-01", "demo-14"]) {
  const response = await fetch(base + "/avatars/" + avatar + ".svg");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /image\/svg\+xml/);
}
const suffix = randomUUID();
const a = await request(
  "/auth/register",
  "POST",
  { email: `a-${suffix}@example.com`, password: "SmokeTest123!" },
  undefined,
  201,
);
const b = await request(
  "/auth/register",
  "POST",
  { email: `b-${suffix}@example.com`, password: "SmokeTest123!" },
  undefined,
  201,
);
const profile = (name) => ({
  properties: [
    { name: "display_name", value: name, visible: true },
    { name: "bio", value: "Тест HTTP-прокси", visible: true },
    { name: "birth_date", value: "2001-04-12", visible: false },
    { name: "city", value: "Москва", visible: true },
  ],
  interests: ["Музыка", "Кофе"],
});
for (const account of [a, b]) {
  await request(
    "/profiles/me",
    "PUT",
    profile(account === a ? "Тест A" : "Тест B"),
    account.accessToken,
  );
  await request(
    "/preferences/me",
    "PUT",
    { minAge: 18, maxAge: 100 },
    account.accessToken,
  );
  assert.ok(
    (
      await request("/interests", "GET", undefined, account.accessToken)
    ).items.includes("Музыка"),
  );
}
const recommendations = await request(
  "/recommendations?limit=50",
  "GET",
  undefined,
  a.accessToken,
);
assert.ok(recommendations.items.some((x) => x.userId === b.user.id));
const publicProfile = await request(
  `/profiles/${b.user.id}`,
  "GET",
  undefined,
  a.accessToken,
);
assert.ok(!publicProfile.properties.some((x) => x.name === "birth_date"));
await request(`/users/${b.user.id}/skip`, "POST", undefined, a.accessToken);
assert.equal(
  (await request("/recommendations", "GET", undefined, a.accessToken))
    .skippedCount,
  1,
);
assert.equal(
  (await request("/recommendations/restart", "POST", undefined, a.accessToken))
    .restored,
  1,
);
assert.ok(
  (
    await request("/recommendations?limit=50", "GET", undefined, a.accessToken)
  ).items.some((x) => x.userId === b.user.id),
);
assert.equal(
  (await request(`/users/${b.user.id}/like`, "POST", undefined, a.accessToken))
    .matched,
  false,
);
const match = await request(
  `/users/${a.user.id}/like`,
  "POST",
  undefined,
  b.accessToken,
);
assert.equal(match.matched, true);
await request(`/matches/${match.matchId}`, "GET", undefined, a.accessToken);
await request(
  `/matches/${match.matchId}/messages`,
  "POST",
  { text: "Привет через прокси!" },
  a.accessToken,
  201,
);
const messages = await request(
  `/matches/${match.matchId}/messages`,
  "GET",
  undefined,
  b.accessToken,
);
assert.equal(messages.items[0].text, "Привет через прокси!");
assert.equal(
  (await request("/recommendations/restart", "POST", undefined, a.accessToken))
    .restored,
  0,
);
await request(`/matches/${match.matchId}`, "GET", undefined, a.accessToken);
const notices = await request(
  "/notifications",
  "GET",
  undefined,
  b.accessToken,
);
assert.equal(
  (
    await request(
      `/notifications/${notices.items[0].id}/read`,
      "PATCH",
      undefined,
      b.accessToken,
    )
  ).seen,
  true,
);
await request("/auth/logout", "POST", undefined, a.accessToken, 204);
await request("/users/me", "GET", undefined, a.accessToken, 401);
console.log(
  "PASS: UI document and GET/POST/PUT/PATCH/204, profiles, interests, preferences, recommendations, match, chat, notifications, logout through " +
    base,
);
