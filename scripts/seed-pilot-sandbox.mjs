import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function loadEnv(path) {
  if (!fs.existsSync(path)) return;

  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function randomPassword() {
  return `Pilot-${crypto.randomBytes(9).toString("base64url")}1!`;
}

async function findUserByEmail(supabase, email) {
  const perPage = 1000;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
  return null;
}

async function ensureUser(supabase, input) {
  const existing = await findUserByEmail(supabase, input.email);
  if (existing) {
    if (process.env.RESET_PILOT_PASSWORDS === "true") {
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: input.password,
        email_confirm: true,
        user_metadata: {
          ...existing.user_metadata,
          role: input.role,
          full_name: input.fullName,
          company_name: input.companyName,
        },
      });
      if (error) throw error;
      return { user: data.user ?? existing, password: input.password, created: false, passwordReset: true };
    }
    return { user: existing, password: input.password, created: false };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      role: input.role,
      full_name: input.fullName,
      company_name: input.companyName,
      accepted_terms: true,
      accepted_privacy: true,
      accepted_marketing: false,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error(`Could not create user ${input.email}`);
  return { user: data.user, password: input.password, created: true };
}

async function upsertByUserId(supabase, table, payload) {
  const { error: updateError } = await supabase
    .from(table)
    .update(payload)
    .eq("user_id", payload.user_id);

  if (updateError) throw updateError;

  const { data: existing, error: selectError } = await supabase
    .from(table)
    .select("user_id")
    .eq("user_id", payload.user_id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  const { error: insertError } = await supabase.from(table).insert(payload);
  if (insertError) throw insertError;
}

async function ensurePilotService(supabase, studentUserId) {
  const title = "Pilot Sandbox - Quick Task";
  const { data: existing, error: selectError } = await supabase
    .from("service_packages")
    .select("id,title")
    .eq("title", title)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("service_packages")
      .update({ student_id: studentUserId })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("service_packages")
    .insert({
      title,
      description:
        "Testowa usluga systemowa do przejscia pelnego flow pilota: brief, umowy, platnosc sandbox, realizacja i akceptacja wyniku.",
      category: "Pilot Sandbox",
      student_id: studentUserId,
      delivery_time_days: 3,
      price: 250,
      price_max: null,
      variants: null,
      commission_rate: 0.15,
      locked_content:
        "Pilot Sandbox: student powinien potwierdzic zakres, dostarczyc jeden plik lub link do wyniku i opisac wykonane prace.",
      is_system: true,
      type: "platform_service",
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function ensurePilotMilestoneTemplate(supabase, packageId) {
  const { data: existing, error: selectError } = await supabase
    .from("service_package_milestone_templates")
    .select("id")
    .eq("package_id", packageId)
    .is("variant_key", null)
    .eq("position", 1)
    .maybeSingle();

  if (selectError) throw selectError;

  const payload = {
    package_id: packageId,
    variant_key: null,
    position: 1,
    title: "Realizacja pilota",
    acceptance_criteria:
      "Firma otrzymuje wynik zgodny z briefem pilota, wraz z krotkim opisem wykonanych prac i linkiem lub plikiem do odbioru.",
    amount_percent: 100,
    due_days: 3,
    active: true,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("service_package_milestone_templates")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("service_package_milestone_templates")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function ensureStripeAccount(userId, email) {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    return null;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });

  let startingAfter;
  for (let page = 0; page < 10; page += 1) {
    const existing = await stripe.accounts.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    const account = existing.data.find((candidate) => candidate.metadata?.user_id === userId);
    if (account) return account.id;
    if (!existing.has_more) break;
    startingAfter = existing.data.at(-1)?.id;
    if (!startingAfter) break;
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "PL",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      user_id: userId,
      product: "student2work",
      seed: "pilot_sandbox",
    },
  });

  return account.id;
}

loadEnv(".env.local");

const supabase = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const credentials = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || "pilot-admin@student2work.example",
    password: process.env.TEST_ADMIN_PASSWORD || randomPassword(),
    role: "admin",
    fullName: "Pilot Sandbox Admin",
  },
  company: {
    email: process.env.TEST_COMPANY_EMAIL || "pilot-company@student2work.example",
    password: process.env.TEST_COMPANY_PASSWORD || randomPassword(),
    role: "company",
    fullName: "Pilot Sandbox Firma",
    companyName: "Pilot Sandbox Sp. z o.o.",
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || "pilot-student@student2work.example",
    password: process.env.TEST_STUDENT_PASSWORD || randomPassword(),
    role: "student",
    fullName: "Pilot Sandbox Student",
  },
};

const created = {};
for (const [key, input] of Object.entries(credentials)) {
  created[key] = await ensureUser(supabase, input);

  await upsertByUserId(supabase, "profiles", {
    user_id: created[key].user.id,
    role: input.role,
    accepted_terms_at: new Date().toISOString(),
    accepted_privacy_at: new Date().toISOString(),
    accepted_marketing: false,
  });
}

await upsertByUserId(supabase, "company_profiles", {
  user_id: created.company.user.id,
  nazwa: "Pilot Sandbox Sp. z o.o.",
  osoba_kontaktowa: "Pilot Sandbox Firma",
  opis: "Firma testowa do pilota Student2Work.",
  branza: "Pilot Sandbox",
  website: "https://example.com",
  nip: "0000000000",
  city: "Warszawa",
  address: "Pilot Sandbox 1",
});

const stripeAccountId = await ensureStripeAccount(created.student.user.id, credentials.student.email);
await upsertByUserId(supabase, "student_profiles", {
  user_id: created.student.user.id,
  public_name: "Pilot Sandbox Student",
  kierunek: "Projektowanie i multimedia",
  rok: "3",
  sciezka: "Quick Task Pilot",
  kompetencje: ["brief", "research", "delivery"],
  bio: "Profil testowy do przejscia pelnego flow pilota Student2Work.",
  linkedin_url: null,
  portfolio_url: null,
  tax_residence_pl: true,
  stripe_account_id: stripeAccountId,
  stripe_onboarding_completed_at: stripeAccountId ? new Date().toISOString() : null,
});

const packageId = await ensurePilotService(supabase, created.student.user.id);
const milestoneTemplateId = await ensurePilotMilestoneTemplate(supabase, packageId);

console.log(JSON.stringify({
  ok: true,
  packageId,
  milestoneTemplateId,
  users: Object.fromEntries(
    Object.entries(created).map(([key, value]) => [
      key,
      {
        email: credentials[key].email,
        password: value.created || value.passwordReset === true
          ? credentials[key].password
          : "(istniejace konto - haslo bez zmian)",
        passwordReset: value.passwordReset === true,
        userId: value.user.id,
        created: value.created,
      },
    ]),
  ),
  stripe: {
    studentAccountId: stripeAccountId,
    onboarding: stripeAccountId
      ? "Konto Stripe test utworzone/podlaczone. Student musi dokonczyc onboarding z profilu przed platnoscia."
      : "Pominieto tworzenie Stripe account, bo STRIPE_SECRET_KEY nie jest testowy.",
  },
}, null, 2));
