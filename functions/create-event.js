const corsHeaders = {
  "Access-Control-Allow-Origin": "https://invite-dashboard.pages.dev",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      ...corsHeaders
    }
  });
}

function getSupabaseBaseUrl(url) {
  return url
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");
}

function createSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0531-\u058f]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function verifyUser(env, accessToken) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const response = await fetch(`${baseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function verifyAdmin(env, email) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    email: `ilike.${email}`,
    is_active: "eq.true",
    select: "email",
    limit: "1"
  });

  const response = await fetch(
    `${baseUrl}/rest/v1/admin_users?${query.toString()}`,
    {
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Admin access check failed.");
  }

  const admins = await response.json();

  return Boolean(admins[0]);
}

async function weddingIdExists(env, weddingId) {
  const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

  const query = new URLSearchParams({
    wedding_id: `eq.${weddingId}`,
    select: "id",
    limit: "1"
  });

  const response = await fetch(
    `${baseUrl}/rest/v1/weddings?${query.toString()}`,
    {
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Could not check event ID.");
  }

  const events = await response.json();

  return Boolean(events[0]);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    if (
      !env.SUPABASE_URL ||
      !env.SUPABASE_SECRET_KEY
    ) {
      throw new Error("Backend environment variables are missing.");
    }

    const authorization = request.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Մուտք գործեք Admin Panel։"
        },
        401
      );
    }

    const accessToken = authorization.slice(7).trim();
    const user = await verifyUser(env, accessToken);

    if (!user?.id || !user?.email) {
      return jsonResponse(
        {
          success: false,
          message: "Մուտքի session-ը վավեր չէ։"
        },
        401
      );
    }

    const isAdmin = await verifyAdmin(
      env,
      user.email.toLowerCase()
    );

    if (!isAdmin) {
      return jsonResponse(
        {
          success: false,
          message: "Այս օգտատերը admin իրավունք չունի։"
        },
        403
      );
    }

    const data = await request.json();

    const eventName = String(data.eventName || "").trim();
    const language = String(data.language || "hy").trim();
    const customWeddingId = String(
      data.weddingId || ""
    ).trim();

    if (!eventName) {
      return jsonResponse(
        {
          success: false,
          message: "Գրեք միջոցառման անվանումը։"
        },
        400
      );
    }

    if (!["hy", "ru", "en"].includes(language)) {
      return jsonResponse(
        {
          success: false,
          message: "Ընտրված լեզուն սխալ է։"
        },
        400
      );
    }

    const weddingId =
      createSlug(customWeddingId || eventName);

    if (!weddingId) {
      return jsonResponse(
        {
          success: false,
          message: "Չհաջողվեց ստեղծել միջոցառման ID-ն։"
        },
        400
      );
    }

    if (await weddingIdExists(env, weddingId)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Այս Wedding ID-ն արդեն օգտագործվում է։ Ընտրեք ուրիշ ID։"
        },
        409
      );
    }

    const baseUrl = getSupabaseBaseUrl(env.SUPABASE_URL);

    const insertResponse = await fetch(
      `${baseUrl}/rest/v1/weddings`,
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SECRET_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          wedding_id: weddingId,
          couple_names: eventName,
          language,
          owner_user_id: user.id,
          is_active: true
        })
      }
    );

    const insertText = await insertResponse.text();

    if (!insertResponse.ok) {
      console.error(
        "Create event error:",
        insertResponse.status,
        insertText
      );

      return jsonResponse(
        {
          success: false,
          message: "Չհաջողվեց ստեղծել միջոցառումը։"
        },
        500
      );
    }

    const createdEvents = JSON.parse(insertText);
    const createdEvent = createdEvents[0];

    return jsonResponse(
      {
        success: true,
        event: createdEvent,
        telegramLink:
          `https://t.me/WeddingInviteArt_bot?start=` +
          encodeURIComponent(createdEvent.connection_code)
      },
      201
    );
  } catch (error) {
    console.error("Create event function error:", error);

    return jsonResponse(
      {
        success: false,
        message: "Սերվերի սխալ է տեղի ունեցել։"
      },
      500
    );
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

export function onRequestGet() {
  return jsonResponse({
    success: true,
    message: "Create event API is working"
  });
}