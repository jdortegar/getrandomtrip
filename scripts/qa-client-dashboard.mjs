/**
 * Manual QA helper — run against local dev server (port 3010).
 * Usage: node scripts/qa-client-dashboard.mjs
 */
const BASE = process.env.QA_BASE_URL ?? "http://localhost:3010";

const routes = [
  { expect: /dashboard\/client/, follow: true, name: "/dashboard redirect", path: "/dashboard" },
  {
    expect: /dashboard\/client\/settings/,
    follow: true,
    name: "/dashboard/settings redirect",
    path: "/dashboard/settings",
  },
  { expect: /Mi panel|My dashboard/i, name: "client home", path: "/dashboard/client" },
  { expect: /Mis viajes|My trips/i, name: "client trips", path: "/dashboard/client/trips" },
  {
    expect: /Mis reseñas|Your reviews|Rating history/i,
    name: "client reviews",
    path: "/dashboard/client/reviews",
  },
  {
    expect: /Notificaciones|Notifications/i,
    name: "client notifications",
    path: "/dashboard/client/notifications",
  },
  {
    expect: /Configuración|Settings|Cuenta|Account/i,
    name: "client settings",
    path: "/dashboard/client/settings",
  },
  { expect: /Tripper OS|Experiencias|Experiences/i, name: "tripper home", path: "/dashboard/tripper" },
];

async function fetchFinalUrl(path, follow = false) {
  const res = await fetch(`${BASE}${path}`, { redirect: follow ? "follow" : "manual" });
  return { res, url: res.url };
}

async function main() {
  const results = [];

  for (const route of routes) {
    try {
      const { res, url } = await fetchFinalUrl(route.path, route.follow ?? false);
      const html = await res.text();
      const passStatus = res.status >= 200 && res.status < 400;
      const passContent = route.expect ? route.expect.test(html) || route.expect.test(url) : true;
      results.push({
        name: route.name,
        ok: passStatus && passContent,
        path: route.path,
        status: res.status,
        url,
      });
    } catch (error) {
      results.push({
        name: route.name,
        ok: false,
        path: route.path,
        error: String(error),
      });
    }
  }

  // API checks
  for (const audience of ["CLIENT", "TRIPPER"]) {
    try {
      const res = await fetch(
        `${BASE}/api/notifications/unread-count?audience=${audience}`,
      );
      const body = await res.json();
      results.push({
        name: `unread-count audience=${audience}`,
        ok: res.status === 401 || typeof body.count === "number",
        path: `/api/notifications/unread-count?audience=${audience}`,
        status: res.status,
        body,
      });
    } catch (error) {
      results.push({
        name: `unread-count audience=${audience}`,
        ok: false,
        error: String(error),
      });
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ base: BASE, failed: failed.length, results }, null, 2));
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
