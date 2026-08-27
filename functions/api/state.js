const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }
});

export async function onRequestGet({ env }) {
  try {
    const row = await env.DB.prepare(
      "SELECT data, updated_at FROM family_state WHERE id = 1"
    ).first();

    if (!row) return json({ data: null, updatedAt: null });
    return json({ data: JSON.parse(row.data), updatedAt: row.updated_at });
  } catch (error) {
    return json({ error: "Kunde inte läsa från D1", details: error.message }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const payload = await request.json();
    const hasMembers = Array.isArray(payload?.members);
    const hasActivities = Array.isArray(payload?.acts);
    const hasLegacyMeals = Array.isArray(payload?.meals);
    const hasWeeklyMealPlans = payload?.mealPlans &&
      typeof payload.mealPlans === "object" &&
      !Array.isArray(payload.mealPlans);

    if (!hasMembers || !hasActivities || (!hasLegacyMeals && !hasWeeklyMealPlans)) {
      return json({
        error: "Ogiltigt dataformat",
        expected: "members och acts som listor samt mealPlans som objekt eller meals som lista"
      }, 400);
    }

    const data = {
      members: payload.members,
      acts: payload.acts.map(activity => ({
        ...activity,
        endDate: activity.endDate || activity.date,
        recurrence: activity.recurrence || "none",
        recurrenceUntil: activity.recurrenceUntil || activity.endDate || activity.date
      }))
    };

    if (hasWeeklyMealPlans) data.mealPlans = payload.mealPlans;
    else data.meals = payload.meals;

    await env.DB.prepare(`
      INSERT INTO family_state (id, data, updated_at)
      VALUES (1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = CURRENT_TIMESTAMP
    `).bind(JSON.stringify(data)).run();

    return json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    return json({ error: "Kunde inte spara till D1", details: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "allow": "GET, PUT, OPTIONS" }
  });
}
