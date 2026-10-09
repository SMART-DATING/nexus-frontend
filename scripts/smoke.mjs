import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = process.argv[2] || "http://127.0.0.1:5173";
async function request(path, method = "GET", body, token, status = 200) {
  const response = await fetch(base + "/api/v1" + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: {
      ...(body !== undefined && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
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
  await request(
    "/contexts/me",
    "POST",
    {
      title: "Мои ценности",
      content:
        "Ценю доверие и честность. Люблю музыку, прогулки и спокойные разговоры.",
    },
    account.accessToken,
    201,
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
const photo = new FormData();
photo.append(
  "file",
  new Blob(
    [
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    ],
    { type: "image/png" },
  ),
  "photo.png",
);
const uploaded = await request(
  "/profiles/me/avatar",
  "POST",
  photo,
  a.accessToken,
);
assert.match(uploaded.avatarUrl, /^\/api\/v1\/photos\/\d+\?access=/);
const image = await fetch(base + uploaded.avatarUrl);
assert.equal(image.status, 200);
assert.match(image.headers.get("content-type"), /image\/jpeg/);
assert.equal(image.headers.get("x-content-type-options"), "nosniff");
assert.equal(
  (await request("/profiles/me", "GET", undefined, a.accessToken)).avatarUrl,
  uploaded.avatarUrl,
);
assert.ok(
  !(await request("/profiles/me", "GET", undefined, b.accessToken)).avatarUrl,
);
await request("/profiles/me/avatar", "DELETE", undefined, a.accessToken);
assert.equal((await fetch(base + uploaded.avatarUrl)).status, 404);
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
const exported = await request(
  "/users/me/data",
  "GET",
  undefined,
  a.accessToken,
);
assert.equal(exported.account.id, a.user.id);
assert.equal(exported.privateContexts.length, 1);
assert.ok(!JSON.stringify(exported).includes("?access="));
assert.ok(!JSON.stringify(exported).includes(a.accessToken));
await request("/users/me/data", "GET", undefined, undefined, 401);
await request("/users/me/discovery", "PUT", { hidden: true }, a.accessToken);
await request(`/profiles/${a.user.id}`, "GET", undefined, b.accessToken, 404);
await request(
  `/users/${a.user.id}/like`,
  "POST",
  undefined,
  b.accessToken,
  404,
);
assert.equal(
  (await request("/users/me", "GET", undefined, a.accessToken)).discoveryHidden,
  true,
);
await request("/users/me/discovery", "PUT", { hidden: false }, a.accessToken);
await request(`/profiles/${a.user.id}`, "GET", undefined, b.accessToken);
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
const remaining = await request(
  "/recommendations?limit=50",
  "GET",
  undefined,
  a.accessToken,
);
const firstPage = await request(
  "/recommendations/next?limit=50",
  "POST",
  undefined,
  a.accessToken,
);
assert.equal(firstPage.cycleRestarted, false);
for (const candidate of remaining.items)
  await request(
    `/users/${candidate.userId}/skip`,
    "POST",
    undefined,
    a.accessToken,
  );
const circle = await request(
  "/recommendations/next?limit=50",
  "POST",
  undefined,
  a.accessToken,
);
assert.equal(circle.cycleRestarted, remaining.items.length > 0);
assert.ok(
  !circle.items.some((x) => x.userId === b.user.id || x.userId === a.user.id),
);
assert.equal(circle.items.length, remaining.items.length);
assert.equal(
  (
    await request(
      `/matches/${match.matchId}/messages`,
      "GET",
      undefined,
      b.accessToken,
    )
  ).items[0].text,
  "Привет через прокси!",
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
  "PASS: UI, multipart photo upload/delete, automatic skip circle excluding likes, profiles, preferences, match, chat, own data export, profile hiding, notifications and logout through " +
    base,
);
