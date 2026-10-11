import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAdminPermission } from "@/lib/admin-auth";
import { HELP_ARTICLES } from "@/lib/help-center";

/**
 * "Was this helpful?" (TAB 17 §17.3): thumbs on every Help Center answer,
 * plus the Live Chat questions the assistant couldn't answer, feeding a
 * content-gap report for Support.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- help_feedback postdates the generated types.
const hdb = (): any => supabaseAdmin as any;

const ARTICLE_IDS = HELP_ARTICLES.map((a) => a.id) as [string, ...string[]];

/** Public: the FAQ page is open to visitors, so no sign-in is required. */
export const recordHelpFeedback = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { article_id?: string; helpful?: boolean; question?: string; source: "faq" | "chat" }) =>
      z
        .object({
          article_id: z.enum(ARTICLE_IDS).optional(),
          helpful: z.boolean().optional(),
          question: z.string().trim().min(3).max(500).optional(),
          source: z.enum(["faq", "chat"]),
        })
        .refine((v) => v.article_id || v.question, "Nothing to record")
        .parse(d),
  )
  .handler(async ({ data }) => {
    // Attribute to the signed-in person when there is one; never required.
    let userId: string | null = null;
    const token = getRequest()
      ?.headers.get("authorization")
      ?.replace(/^Bearer /, "");
    if (token) {
      const { data: u } = await supabaseAdmin.auth.getUser(token);
      userId = u.user?.id ?? null;
    }
    await hdb()
      .from("help_feedback")
      .insert({
        article_id: data.article_id ?? null,
        helpful: data.helpful ?? null,
        question: data.question ?? null,
        source: data.source,
        user_id: userId,
      })
      .then(
        () => undefined,
        () => undefined,
      );
    return { ok: true };
  });

export type HelpGapReport = {
  articles: { id: string; q: string; category: string; helpful: number; unhelpful: number }[];
  unanswered: { question: string; source: string; created_at: string }[];
  days: number;
};

export const getHelpContentGaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: number }) =>
    z.object({ days: z.number().int().min(1).max(365).default(30) }).parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<HelpGapReport> => {
    await requireAdminPermission(context.userId, "contact");
    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();
    const { data: rows } = await hdb()
      .from("help_feedback")
      .select("article_id, helpful, question, source, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    const R = (rows ?? []) as {
      article_id: string | null;
      helpful: boolean | null;
      question: string | null;
      source: string;
      created_at: string;
    }[];
    const articles = HELP_ARTICLES.map((a) => ({
      id: a.id,
      q: a.q,
      category: a.category,
      helpful: R.filter((r) => r.article_id === a.id && r.helpful === true).length,
      unhelpful: R.filter((r) => r.article_id === a.id && r.helpful === false).length,
    })).sort((x, y) => y.unhelpful - x.unhelpful || x.helpful - y.helpful);
    const unanswered = R.filter((r) => !r.article_id && r.question)
      .slice(0, 200)
      .map((r) => ({ question: r.question!, source: r.source, created_at: r.created_at }));
    return { articles, unanswered, days: data.days };
  });
