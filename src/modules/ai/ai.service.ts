import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── 1. User Based Recommendations ────────────────────────────────────────────
export const getUserRecommendationsService = async (userId: string) => {
  const votes = await prisma.vote.findMany({
    where: { userId, type: "UP" },
    include: { idea: { select: { categoryId: true } } },
  });

  const categoryCount: Record<string, number> = {};
  votes.forEach((v) => {
    categoryCount[v.idea.categoryId] =
      (categoryCount[v.idea.categoryId] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  let recommended = await prisma.idea.findMany({
    where: {
      status: "APPROVED",
      isDeleted: false,
      ...(topCategories.length ? { categoryId: { in: topCategories } } : {}),
    },
    orderBy: { viewCount: "desc" },
    take: 12,
    include: { category: true, author: { select: { name: true } } },
  });

  if (recommended.length < 6) {
    const fallback = await prisma.idea.findMany({
      where: { status: "APPROVED", isDeleted: false },
      orderBy: { viewCount: "desc" },
      take: 12 - recommended.length,
      include: { category: true, author: { select: { name: true } } },
    });
    recommended = [...recommended, ...fallback];
  }

  return { recommendations: recommended };
};

// ─── 2. Similar Ideas ───────────────────────────────────────────────────────
export const getSimilarIdeasService = async (ideaId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { categoryId: true },
  });
  if (!idea) throw new AppError(404, "Idea not found");

  const similar = await prisma.idea.findMany({
    where: {
      status: "APPROVED",
      isDeleted: false,
      id: { not: ideaId },
      categoryId: idea.categoryId,
    },
    orderBy: { viewCount: "desc" },
    take: 8,
    include: { category: true, author: { select: { name: true } } },
  });

  return similar;
};

// ─── 3. Search Suggestions ────────────────────────────────────────────────────
export const getSearchSuggestionsService = async (query: string) => {
  if (!query || query.trim().length < 2) return { suggestions: [] };

  const q = query.trim();

  const [ideas, categories] = await Promise.all([
    prisma.idea.findMany({
      where: {
        status: "APPROVED",
        isDeleted: false,
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, isPaid: true, price: true },
      orderBy: { viewCount: "desc" },
      take: 5,
    }),
    prisma.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true },
      take: 3,
    }),
  ]);

  return {
    suggestions: {
      ideas: ideas.map((i) => ({ ...i, type: "idea" })),
      categories: categories.map((c) => ({ ...c, type: "category" })),
    },
  };
};

// ─── 4. Trending Ideas ─────────────────────────────────────────────────────
export const getTrendingIdeasService = async () => {
  const trending = await prisma.idea.findMany({
    where: { status: "APPROVED", isDeleted: false },
    orderBy: { viewCount: "desc" },
    take: 12,
    include: { category: true, author: { select: { name: true } } },
  });

  return { context: "trending_this_week", ideas: trending };
};

// ─── 5. AI Chatbot ────────────────────────────────────────────────────────────
export const aiChatService = async (userId: string, message: string) => {
  if (!message?.trim()) throw new AppError(400, "Message is required");

  try {
    // Fetch user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const userIdeasCount = await prisma.idea.count({
      where: { authorId: userId },
    });

    // Fetch platform-wide data for context
    const [topVotedIdeas, recentIdeas, totalIdeasCount] = await Promise.all([
      // Top voted ideas (count UP votes)
      prisma.idea.findMany({
        where: { status: "APPROVED", isDeleted: false },
        select: {
          id: true,
          title: true,
          isPaid: true,
          price: true,
          viewCount: true,
          _count: { select: { votes: true, comments: true } },
        },
        orderBy: { votes: { _count: "desc" } },
        take: 5,
      }),
      // Recent ideas
      prisma.idea.findMany({
        where: { status: "APPROVED", isDeleted: false },
        select: { id: true, title: true, isPaid: true, price: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Total approved ideas
      prisma.idea.count({ where: { status: "APPROVED", isDeleted: false } }),
    ]);

    const topVotedContext =
      topVotedIdeas.length > 0
        ? `\nTop Voted Ideas on the platform:\n` +
          topVotedIdeas
            .map(
              (i, idx) =>
                `${idx + 1}. [${i.title}](/ideas/${i.id}) — ${i._count.votes} votes, ${i._count.comments} comments, ${i.viewCount} views (${i.isPaid ? "Paid: ৳" + i.price : "Free"})`,
            )
            .join("\n")
        : "";

    const recentIdeasContext =
      recentIdeas.length > 0
        ? `\nMost Recent Ideas:\n` +
          recentIdeas
            .map((i) => `- [${i.title}](/ideas/${i.id}) (${i.isPaid ? "Paid" : "Free"})`)
            .join("\n")
        : "";

    // Extract keywords — keep Bengali (Unicode range) and English alphanumeric
    const words = message
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF ]/g, "")
      .split(" ");
    const stopWords = new Set([
      "what",
      "where",
      "how",
      "when",
      "who",
      "why",
      "is",
      "are",
      "am",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "about",
      "can",
      "could",
      "would",
      "should",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "want",
      "need",
      "find",
      "search",
      "looking",
      "buy",
      "get",
      "show",
      "tell",
      "me",
    ]);

    const keywords = words.filter((w) => w.length > 1 && !stopWords.has(w));

    let ideaContext = "";
    if (keywords.length > 0) {
      const ideas = await prisma.idea.findMany({
        where: {
          status: "APPROVED",
          isDeleted: false,
          OR: keywords.flatMap((kw) => [
            { title: { contains: kw, mode: "insensitive" } },
            { description: { contains: kw, mode: "insensitive" } },
            { problemStatement: { contains: kw, mode: "insensitive" } },
            { proposedSolution: { contains: kw, mode: "insensitive" } },
          ]),
        },
        take: 5,
        select: { id: true, title: true, isPaid: true, price: true, description: true },
      });
      if (ideas.length > 0) {
        ideaContext =
          `\nRelevant ideas found in the database:\n` +
          ideas
            .map(
              (i) =>
                `- [${i.title}](/ideas/${i.id}) — ${i.description?.slice(0, 80)}... (${i.isPaid ? "Paid: ৳" + i.price : "Free"})`,
            )
            .join("\n");
      }
    }

    const systemInstruction = `You are a helpful and concise AI assistant for EcoSpark, an Idea sharing platform.
Users can share ideas, vote on them, comment, and buy premium/paid ideas.

Context Information:
- User Name: ${user?.name?.split(" ")[0] || "User"}
- User's Published Ideas Count: ${userIdeasCount}
- Total Approved Ideas on Platform: ${totalIdeasCount}
- Policies: Paid ideas can be unlocked via Stripe payment. Ideas can be UP or DOWN voted.
- Support Contact: support@ecospark.com${topVotedContext}${recentIdeasContext}${ideaContext}

Instructions:
- IMPORTANT LANGUAGE RULE: If the user speaks in Bengali (or writes Bengali using English letters like "Banglish"), you MUST reply in Bengali. Otherwise, ALWAYS reply in English.
- Answer directly and naturally based on the provided Context Information.
- Format using Markdown (bold, bullet points where helpful).
- If asked which idea has most votes/likes, use the Top Voted Ideas list above.
- If asked about recent ideas, use the Most Recent Ideas list above.
- If they ask about a specific idea and it appears in matching ideas, mention it WITH the markdown link provided.
- Whenever you mention an idea from the context, YOU MUST format it as a clickable markdown link EXACTLY as it appears in the context (e.g. [Idea Title](/ideas/id)). Do not just say the title, include the link!
- Be concise. Do not make up data that is not in the context.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return {
      intent: "ai_response",
      reply: response.text,
      data: null,
    };
  } catch (error) {
    console.error("AI Generation Error:", error);
    return {
      intent: "error",
      reply:
        "Sorry, I'm having trouble connecting to my AI brain right now. Please try again later.",
      data: null,
    };
  }
};
