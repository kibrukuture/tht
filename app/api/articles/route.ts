import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCache, setCache } from "@/lib/cache";

interface ArticleSource {
  name: string;
  url: string;
}
interface Article {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: ArticleSource;
}
interface GNewsResponse {
  totalArticles: number;
  articles: Article[];
}

const GNEWS_API_URL = "https://gnews.io/api/v4";

const apiQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Query parameter 'q' cannot be empty.")
    .default("technology"),
  max: z.coerce.number().int().min(1).max(100).default(10),
  category: z
    .enum([
      "general",
      "world",
      "nation",
      "business",
      "technology",
      "entertainment",
      "sports",
      "science",
      "health",
    ])
    .optional(),
  author: z.string().optional(),
  from: z
    .string()
    .datetime({ message: "Invalid 'from' date format. Use ISO 8601." })
    .optional(),
  to: z
    .string()
    .datetime({ message: "Invalid 'to' date format. Use ISO 8601." })
    .optional(),
});

export async function GET(request: NextRequest) {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GNews API key is not configured." },
      { status: 500 }
    );
  }

  const queryParams = Object.fromEntries(
    request.nextUrl.searchParams.entries()
  );
  const validationResult = apiQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters.",
        details: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { q, max, category, author, from, to } = validationResult.data;

  const gnewsParams = new URLSearchParams({
    q,
    max: String(max),
    lang: "en",
    apikey: apiKey,
  });
  if (category) gnewsParams.set("category", category);
  if (from) gnewsParams.set("from", from);
  if (to) gnewsParams.set("to", to);

  const gnewsUrl = `${GNEWS_API_URL}/search?${gnewsParams.toString()}`;
  const cacheKey = `gnews_func:${gnewsParams.toString()}`;

  try {
    let data = getCache<GNewsResponse>(cacheKey);
    let cacheStatus: "HIT" | "MISS" = "MISS";

    if (data) {
      cacheStatus = "HIT";
    } else {
      const res = await fetch(gnewsUrl);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `GNews API error: ${(errorData.errors || ["Unknown error"]).join(
            ", "
          )}`
        );
      }
      const freshData = (await res.json()) as GNewsResponse;

      setCache(cacheKey, freshData, 600000);
      data = freshData;
    }

    let articles = data.articles || [];

    if (author) {
      articles = articles.filter((article) =>
        article.source?.name?.toLowerCase().includes(author.toLowerCase())
      );
    }

    return NextResponse.json({
      meta: { cacheStatus, requestParams: validationResult.data },
      totalResults: articles.length,
      articles,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown internal error occurred";
    console.error("API Route Critical Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
