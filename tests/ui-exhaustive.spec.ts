import { test, expect, type Page, type Locator } from "@playwright/test";

test.setTimeout(240000);

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

async function clickTaskToggle(page: Page, button: Locator) {
  const [res] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/api/app/tasks/")),
    button.click()
  ]);
  expect(res.status()).toBe(200);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/connexion");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForURL("**/app/planning", { timeout: 15000 }),
    page.getByRole("button", { name: /connect/i }).click()
  ]);
}

test("exhaustive UI (parent + nounou) and 5 business flows", async ({ page }) => {
  const guards = attachPageGuards(page);

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
    const res = await page.goto(path);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByRole("link", { name: "CarnetNounou" })).toBeVisible();
  }

  await page.goto("/");
  await page.getByRole("button", { name: /mode/i }).click();

  const headerLinks = [
    { name: /notre r/i, url: "**/notre-role" },
    { name: /tarifs/i, url: "**/tarifs" },
    { name: /contact/i, url: "**/contact" },
    { name: /cgu/i, url: "**/cgu" }
  ];

  const headerNav = page.getByRole("navigation").first();
  for (const link of headerLinks) {
    await Promise.all([page.waitForURL(link.url), headerNav.getByRole("link", { name: link.name }).click()]);
    await page.goto("/");
  }

  await Promise.all([page.waitForURL("**/connexion"), page.getByRole("link", { name: /connexion/i }).click()]);
  await page.goto("/");
  await Promise.all([
    page.waitForURL("**/inscription"),
    page.getByRole("link", { name: /commencer/i }).first().click()
  ]);
  await page.goto("/");
  await Promise.all([page.waitForURL("**/connexion"), page.getByRole("button", { name: /se connecter/i }).click()]);
  await page.goto("/");
  await Promise.all([
    page.waitForURL(/connexion\?next=/),
    page.getByRole("button", { name: /app/i }).click()
  ]);

  const parentEmail = `parent+${Date.now()}@example.com`;
  const parentPassword = "Password1234";
  const parentName = "Parent Test";

  await page.goto("/inscription");
  await page.fill('input[name="name"]', parentName);
  await page.fill('input[name="email"]', parentEmail);
  await page.fill('input[name="password"]', parentPassword);
  await Promise.all([
    page.waitForURL("**/app/planning", { timeout: 15000 }),
    page.getByRole("button", { name: /cr/i }).click()
  ]);

  await page.goto("/app");
  await page.waitForURL("**/app/planning", { timeout: 15000 });

  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === sessionCookieName)).toBeTruthy();

  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Previous period" }).click();

  await page.getByRole("button", { name: "Semaine" }).click();
  await expect(page.getByText(/vue semaine/i)).toBeVisible();
  const weekButtons = page.locator("button").filter({ hasText: /^\d{2}$/ });
  const weekCount = await weekButtons.count();
  for (let i = 0; i < weekCount; i++) {
    await weekButtons.nth(i).click();
  }

  await page.getByRole("button", { name: "Mois" }).click();
  await expect(page.getByText(/vue mois/i)).toBeVisible();
  const monthButtons = page.locator("button").filter({ hasText: /^\d{2}$/ });
  const monthCount = await monthButtons.count();
  for (let i = 0; i < monthCount; i++) {
    await monthButtons.nth(i).click();
    await page.getByRole("button", { name: "Mois" }).click();
  }

  await page.getByRole("button", { name: "Jour", exact: true }).click();
  await expect(page.getByText(/plages de garde/i)).toBeVisible();
  await page.locator('input[type="date"]').fill(todayYmd());

  await page.getByRole("button", { name: /configurer/i }).click();
  const mondayRow = page.getByText("Lun", { exact: true }).locator("..");
  const mondayInputs = mondayRow.locator("input");
  await mondayInputs.nth(0).setChecked(false);
  await mondayInputs.nth(0).setChecked(true);
  await mondayInputs.nth(1).fill("08:30");
  await mondayInputs.nth(2).fill("17:30");
  await page.getByRole("button", { name: /enregistrer/i }).click();
  await expect(page.getByRole("button", { name: /configurer/i })).toBeVisible();

  await page.getByRole("button", { name: /ajouter une plage/i }).click();
  let modal = page.locator("div.fixed.inset-0.z-50");
  await modal.getByRole("button", { name: /fermer/i }).click();

  await page.getByRole("button", { name: /ajouter une plage/i }).click();
  modal = page.locator("div.fixed.inset-0.z-50");
  const exInputs = modal.locator("input");
  await exInputs.nth(0).fill("20:00");
  await exInputs.nth(1).fill("21:00");
  await exInputs.nth(2).fill("Test plage");
  await modal.getByRole("button", { name: /enregistrer/i }).click();
  const exceptionsSection = page.getByText(/exceptions sur cette date/i).locator("..").locator("..");
  await expect(exceptionsSection).toBeVisible();

  await exceptionsSection.getByRole("button", { name: /^modifier$/i }).click();
  modal = page.locator("div.fixed.inset-0.z-50");
  const modInputs = modal.locator("input");
  await modInputs.nth(0).fill("20:30");
  await modInputs.nth(1).fill("21:30");
  await modInputs.nth(2).fill("Test modif");
  await modal.getByRole("button", { name: /enregistrer/i }).click();

  page.once("dialog", (d) => d.accept());
  await exceptionsSection.getByRole("button", { name: /supprimer/i }).click();

  await page.getByRole("button", { name: /jour off/i }).click();
  modal = page.locator("div.fixed.inset-0.z-50");
  await modal.getByRole("button", { name: /enregistrer/i }).click();
  page.once("dialog", (d) => d.accept());
  await exceptionsSection.getByRole("button", { name: /supprimer/i }).click();

  await page.getByRole("button", { name: /modifier la journ/i }).click();
  modal = page.locator("div.fixed.inset-0.z-50");
  const replInputs = modal.locator("input");
  await replInputs.nth(0).fill("10:00");
  await replInputs.nth(1).fill("12:00");
  await replInputs.nth(2).fill("Replace test");
  await modal.getByRole("button", { name: /enregistrer/i }).click();
  page.once("dialog", (d) => d.accept());
  await exceptionsSection.getByRole("button", { name: /supprimer/i }).click();

  const addTaskButtons = page.getByRole("button", { name: /\+.*t.*che/i });
  const addCount = await addTaskButtons.count();
  if (addCount > 0) {
    await addTaskButtons.nth(0).click();
    modal = page.locator("div.fixed.inset-0.z-50");
    await modal.getByRole("button", { name: /fermer/i }).click();
  }

  if (addCount > 1) {
    await addTaskButtons.nth(1).click();
    modal = page.locator("div.fixed.inset-0.z-50");
    await modal.getByRole("button", { name: /annuler/i }).click();
  }

  if (addCount > 2) {
    await addTaskButtons.nth(2).click();
    modal = page.locator("div.fixed.inset-0.z-50");
    const taskInputs = modal.locator("input");
    await taskInputs.nth(0).fill("Task A");
    await taskInputs.nth(1).fill("Desc A");
    await taskInputs.nth(2).fill("09:15");
    await modal.getByRole("button", { name: /cr/i }).click();
  }

  const taskRow = page
    .locator("div")
    .filter({ hasText: "Task A" })
    .filter({ has: page.getByRole("button", { name: /fait|rouvrir/i }) })
    .first();
  await expect(taskRow).toBeVisible();
  await clickTaskToggle(page, taskRow.getByRole("button", { name: /fait/i }));
  await expect(taskRow.getByRole("button", { name: /rouvrir/i })).toBeVisible();
  await clickTaskToggle(page, taskRow.getByRole("button", { name: /rouvrir/i }));

  const navLinks = [
    { name: /aujourd/i, url: "**/app/planning" },
    { name: /planning/i, url: "**/app/planning" },
    { name: /t.*ches/i, url: "**/app/taches" },
    { name: /journal/i, url: "**/app/journal" },
    { name: /courses/i, url: "**/app/courses" },
    { name: /alertes/i, url: "**/app/notifications" },
    { name: /r.*glages/i, url: "**/app/parametres" }
  ];

  for (const link of navLinks) {
    await Promise.all([page.waitForURL(link.url), page.getByRole("link", { name: link.name }).click()]);
  }

  const employeeEmail = `employee+${Date.now()}@example.com`;
  const employeeRes = await page.request.post("/api/app/members/create-employee", {
    data: { email: employeeEmail, displayName: "Nounou Test" }
  });
  expect(employeeRes.status()).toBe(200);
  const employeeJson = await employeeRes.json();
  const employeePassword = employeeJson?.tempPassword as string | null;
  expect(employeePassword).toBeTruthy();

  await page.getByRole("button", { name: /connexion/i }).click();
  await page.waitForURL("**/");

  await login(page, employeeEmail, employeePassword || "");
  await page.getByRole("button", { name: /mode/i }).click();

  await expect(page.getByRole("button", { name: /configurer/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /ajouter une plage/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /modifier la journ/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /jour off/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /\+.*t.*che/i })).toHaveCount(0);

  await page.getByRole("button", { name: "Next period" }).click();
  await page.getByRole("button", { name: "Previous period" }).click();
  await page.getByRole("button", { name: "Semaine" }).click();
  await page.getByRole("button", { name: "Jour", exact: true }).click();

  await expect(taskRow).toBeVisible();
  await clickTaskToggle(page, taskRow.getByRole("button", { name: /fait/i }));

  await page.getByRole("button", { name: /connexion/i }).click();
  await page.waitForURL("**/");

  guards.assertNoErrors();
});
