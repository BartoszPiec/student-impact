"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  buildLegacyRequirementsText,
  buildRequestSnapshot,
  extractRequestFormAnswers,
} from "@/lib/services/service-order-snapshots";

export async function createOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const packageId = formData.get("packageId") as string;
  const title = formData.get("title") as string;
  const contactEmail = formData.get("contact_email") as string;
  const companyWebsite = formData.get("company_website") as string;

  const { data: pkgData, error: pkgError } = await supabase
    .from("service_packages")
    .select("student_id, is_system, form_schema, price, title")
    .eq("id", packageId)
    .single();

  if (pkgError || !pkgData) {
    throw new Error("Package not found");
  }

  const entries = Array.from(formData.entries());
  const schema = Array.isArray(pkgData.form_schema) ? pkgData.form_schema : [];
  const formAnswers = extractRequestFormAnswers(entries, schema);
  const additionalInfo = formData.get("requirements") as string;

  const requirementsText = buildLegacyRequirementsText({
    contactEmail,
    companyWebsite,
    formAnswers,
    additionalInfo,
  });

  const requestSnapshot = buildRequestSnapshot({
    packageId,
    packageTitle: pkgData.title || title || "Usługa",
    contactEmail,
    companyWebsite,
    formAnswers,
    additionalInfo,
  });

  const { data: order, error } = await supabase
    .from("service_orders")
    .insert({
      company_id: user.id,
      package_id: packageId,
      student_id: pkgData.is_system ? null : pkgData.student_id,
      amount: Number(pkgData.price),
      requirements: requirementsText,
      request_snapshot: requestSnapshot,
      status: "pending",
      title,
      contact_email: contactEmail,
      company_website: companyWebsite,
      entry_point: "company_request",
      initiated_by: "company",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (pkgData.student_id && pkgData.is_system !== true) {
    let conversationId = null;

    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        company_id: user.id,
        student_id: pkgData.student_id,
        status: "active",
        type: "inquiry",
        package_id: packageId,
        application_id: null,
        service_order_id: order.id,
      })
      .select("id")
      .single();

    if (newConv) {
      conversationId = newConv.id;
    }

    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: "Zapytano o wycenę usługi.",
      });

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: requirementsText,
        event: "inquiry_details",
      });

      revalidatePath("/app/chat");
      revalidatePath("/app/company/packages");
      redirect("/app/company/packages?success=inquiry_sent");
    }
  }

  revalidatePath("/app/company/packages");
  redirect("/app/company/packages");
}

export async function startInquiry(packageId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: pkg } = await supabase.from("service_packages").select("student_id, title").eq("id", packageId).single();

  if (!pkg || !pkg.student_id) {
    throw new Error("Cannot start inquiry for this package");
  }

  const { data: existingStats } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", user.id)
    .eq("student_id", pkg.student_id)
    .eq("package_id", packageId)
    .limit(1);

  let conversationId = existingStats?.[0]?.id;

  if (!conversationId) {
    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({
        company_id: user.id,
        student_id: pkg.student_id,
        status: "active",
        type: "inquiry",
        package_id: packageId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error("Failed to create conversation");
    }

    conversationId = newConv.id;
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: message || `Dzień dobry, chciałbym zapytać o szczegóły usługi: "${pkg.title}".`,
  });

  revalidatePath("/app/chat");
  redirect(`/app/chat/${conversationId}`);
}
