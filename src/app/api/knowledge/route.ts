import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  searchKnowledge,
  getCategories,
  getSuggestedSkills,
} from "@/lib/knowledge/search";

const SearchSchema = z.object({
  query: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");
    const limitParam = searchParams.get("limit");

    if (!query) {
      // Return categories if no query
      return NextResponse.json({
        categories: getCategories(),
      });
    }

    const validation = SearchSchema.safeParse({
      query,
      limit: limitParam ? parseInt(limitParam) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const results = searchKnowledge(
      validation.data.query,
      validation.data.limit || 5
    );
    const suggestions = getSuggestedSkills(validation.data.query);

    return NextResponse.json({
      results,
      suggestions,
      totalResults: results.length,
    });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
