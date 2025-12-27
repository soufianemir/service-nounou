import { test, expect, type Page } from "@playwright/test";

const sessionCookieName = process.env.SESSION_COOKIE_NAME ?? "cn_session";

function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function attachPageGuards(page: Page) {
  const consoleErrors: string[] = [];
  const requestFailures: string[] = [];
  const responseErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(err.message));
  page.on("requestfailed", (req) => {
    const failure = req.failure()?.errorText ?? "request failed";
    const url = req.url();
    if (failure.includes("net::ERR_ABORTED") && req.resourceType() === "document") {
      return;
    }
    if (failure.includes("net::ERR_ABORTED") && url.includes("/connexion?next=")) {
      return;
    }
    if (failure.includes("net::ERR_ABORTED") && (url.includes("_rsc=") || url.includes("/_next/"))) {
      return;
    }
    requestFailures.push(`${req.method()} ${url} ${failure}`);
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status < 400) return;
    const url = res.url();
    if (url.endsWith("/favicon.ico")) return;
    responseErrors.push(`${status} ${url}`);
  });

  return {
    assertNoErrors: () => {
      expect(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
      expect(requestFailures, `request failures: ${requestFailures.join(" | ")}`).toEqual([]);
      expect(responseErrors, `response errors: ${responseErrors.join(" | ")}`).toEqual([]);
    }
  };
}

test("smoke: public, auth, app pages, apis", async ({ page }) => {
  const guards = attachPageGuards(page);
  let res: Awaited<ReturnType<typeof page.goto>> | null = null;

  const publicPages = [
    "/",
    "/connexion",
    "/inscription",
    "/contact",
    "/tarifs",
    "/cgu",
    "/mentions-legales",
    "/politique-confidentialite",
    "/notre-role",
    "/cookies"
  ];

  for (const path of publicPages) {
    res = await page.goto(path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("link", { name: "CarnetNounou" })).toBeVisible();
  }

  const email = `smoke+${Date.now()}@example.com`;
  const password = "Password1234";
  const displayName = "Smoke Parent";

  await page.goto("/inscription");
  await page.fill('input[name="name"]', displayName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  await Promise.all([
    page.waitForURL("**/app", { timeout: 15000 }),
    page.getByRole("button", { name: /cr/i }).click()
  ]);

  await page.goto("/app");
  await page.waitForURL("**/app", { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /aujourd/i })).toBeVisible();

  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === sessionCookieName)).toBeTruthy();

  const navPages = [
    { path: "/app", check: () => page.getByRole("heading", { name: /aujourd/i }) },
    { path: "/app/planning", check: () => page.getByRole("button", { name: "Jour", exact: true }) },
    { path: "/app/taches", check: () => page.getByRole("heading", { name: /taches/i }) },
    { path: "/app/journal", check: () => page.getByRole("heading", { name: /journal/i }) },
    { path: "/app/courses", check: () => page.getByRole("heading", { name: /courses/i }) },
    { path: "/app/parametres", check: () => page.getByRole("heading", { name: /parametres/i }) },
    { path: "/app/notifications", check: () => page.getByRole("heading", { name: /notifications/i }) }
  ];

  for (const entry of navPages) {
    res = await page.goto(entry.path);
    expect(res?.status()).toBeLessThan(400);
    await expect(entry.check()).toBeVisible();
  }

  const loginRes = await page.request.post("/api/auth/login", { form: { email, password } });
  expect(loginRes.status()).toBeLessThan(400);

  const ymd = todayYmd();
  const createTaskRes = await page.request.post("/api/app/tasks", {
    data: { title: "Smoke task", dueYmd: ymd, dueTime: "09:00" }
  });
  expect(createTaskRes.status()).toBe(201);
  const created = await createTaskRes.json();
  const taskId = created?.task?.id as string | undefined;
  expect(taskId).toBeTruthy();

  const listRes = await page.request.get(`/api/app/tasks?fromYmd=${ymd}&toYmd=${ymd}`);
  expect(listRes.status()).toBe(200);

  const patchRes = await page.request.patch(`/api/app/tasks/${taskId}`, { data: { status: "DONE" } });
  expect(patchRes.status()).toBe(200);

  const deleteRes = await page.request.delete(`/api/app/tasks/${taskId}`);
  expect(deleteRes.status()).toBe(200);

  const employeeRes = await page.request.post("/api/app/members/create-employee", {
    data: { email: `employee+${Date.now()}@example.com`, displayName: "Smoke Employee" }
  });
  expect(employeeRes.status()).toBe(200);

  const weeklyRes = await page.request.post("/api/app/schedule/weekly", {
    data: [{ weekday: 0, enabled: true, start: "09:00", end: "18:00" }]
  });
  expect(weeklyRes.status()).toBe(200);

  const exceptionsGet = await page.request.get("/api/app/schedule/exceptions");
  expect(exceptionsGet.status()).toBe(200);

  const exceptionCreate = await page.request.post("/api/app/schedule/exceptions", {
    data: { dateYmd: ymd, kind: "OFF", note: "Smoke test" }
  });
  expect(exceptionCreate.status()).toBe(200);
  const exJson = await exceptionCreate.json();
  const exceptionId = exJson?.exception?.id as string | undefined;
  expect(exceptionId).toBeTruthy();

  const exceptionPatch = await page.request.patch("/api/app/schedule/exceptions", {
    data: { id: exceptionId, dateYmd: ymd, kind: "REPLACE", start: "10:00", end: "12:00" }
  });
  expect(exceptionPatch.status()).toBe(200);

  const exceptionDelete = await page.request.delete(`/api/app/schedule/exceptions?id=${exceptionId}`);
  expect(exceptionDelete.status()).toBe(200);

  const logoutRes = await page.request.post("/api/auth/logout", { form: {} });
  expect(logoutRes.status()).toBeLessThan(400);

  guards.assertNoErrors();
});
