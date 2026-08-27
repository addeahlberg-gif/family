const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare("SELECT data, updated_at FROM family_state WHERE id = 1").first();
    if (!row) return json({ data: null, updatedAt: null });
    return json({ data: JSON.parse(row.data), updatedAt: row.updated_at });
  } catch (error) {
    return json({ error: "Kunde inte läsa från D1", details: error.message }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const payload = await request.json();
    if (!payload || !Array.isArray(payload.members) || !Array.isArray(payload.acts) || !Array.isArray(payload.meals)) {
      return json({ error: "Ogiltigt dataformat" }, 400);
    }
    const data = JSON.stringify({ members: payload.members, acts: payload.acts, meals: payload.meals });
    await env.DB.prepare(`
      INSERT INTO family_state (id, data, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP
    `).bind(data).run();
    return json({ ok: true });
  } catch (error) {
    return json({ error: "Kunde inte spara till D1", details: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "allow": "GET, PUT, OPTIONS" } });
}
