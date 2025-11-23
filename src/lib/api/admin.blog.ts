import { apiRequest, ApiClientError } from './client';

export const adminBlogApi = {
  getPost: async (
    idOrSlug: string
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').BlogPost>
  > => {
    // The backend does not expose GET /admin/posts/:id; try best-effort lookup.
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug
      );

    // Helper to wrap the result as ApiResponse
    const wrap = (post: any) => ({
      data: post,
      status: 'success' as const,
      timestamp: new Date().toISOString(),
    });

    // Helper to run a search query
    const runSearch = async (q: string, limit = 50) => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('search', q);
      const qs = params.toString();
      const list = await apiRequest<import('@/types/api').BlogPost[]>(
        `/v1/blog/admin/posts${qs ? `?${qs}` : ''}`
      );
      return {
        items: (list as any)?.data ?? [],
        pagination: (list as any)?.pagination,
      };
    };

    // 1) If looks like a slug, try search strategies
    if (!isUuid) {
      // Convert slug to spaced words for better search results
      // e.g. "my-post-title" -> "my post title"
      const spaced = idOrSlug.replace(/-/g, ' ');

      // Try searching by the spaced title first (more likely to succeed)
      const searchResult = await runSearch(spaced, 50);

      // Try to find an exact slug match first
      let found = searchResult.items.find((p: any) => p?.slug === idOrSlug);

      if (!found) {
        // If no slug match, try to find by title
        const normalizedQuery = spaced.toLowerCase();
        found = searchResult.items.find(
          (p: any) => (p?.title ?? '').toLowerCase() === normalizedQuery
        );
      }

      // If still not found, and we have results, maybe the first one is it?
      // This is a heuristic: if we searched for the exact slug-as-words,
      // the top result is highly likely to be the post.
      if (!found && searchResult.items.length > 0) {
        // Check if the slug contains the query or vice versa to be safer
        const first = searchResult.items[0];
        const firstSlug = (first.slug ?? '').toLowerCase();
        const firstTitle = (first.title ?? '').toLowerCase();
        if (
          firstSlug.includes(idOrSlug) ||
          idOrSlug.includes(firstSlug) ||
          firstTitle.includes(spaced) ||
          spaced.includes(firstTitle)
        ) {
          found = first;
        }
      }

      if (found) {
        return wrap(found);
      }
    }

    // 2) Fallback: scan through paginated lists (up to 10 pages) to find by id or slug
    const limit = 100; // API allows up to 100
    const params2 = new URLSearchParams();
    params2.set('limit', String(limit));
    params2.set('page', '1');
    const qs2 = params2.toString();
    const first = await apiRequest<import('@/types/api').BlogPost[]>(
      `/v1/blog/admin/posts${qs2 ? `?${qs2}` : ''}`
    );
    const firstItems = (first as any)?.data ?? [];
    let found = firstItems.find(
      (p: any) => p?.id === idOrSlug || p?.slug === idOrSlug
    );
    if (found) return wrap(found);

    const totalPages = (first as any)?.pagination?.totalPages || 1;
    const maxPages = Math.min(totalPages, 10);
    for (let page = 2; page <= maxPages; page++) {
      const paramsN = new URLSearchParams();
      paramsN.set('limit', String(limit));
      paramsN.set('page', String(page));
      const qsN = paramsN.toString();
      const listN = await apiRequest<import('@/types/api').BlogPost[]>(
        `/v1/blog/admin/posts${qsN ? `?${qsN}` : ''}`
      );
      const itemsN = (listN as any)?.data ?? [];
      found = itemsN.find(
        (p: any) => p?.id === idOrSlug || p?.slug === idOrSlug
      );
      if (found) return wrap(found);
    }

    throw new ApiClientError('NOT_FOUND', 'Resource not found', 404);
  },
  getPosts: async (
    query?: import('@/types/api').BlogPostQuery
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').BlogPost[]>
  > => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.authorId) params.set('authorId', query.authorId);
    if (query?.tags?.length) params.set('tags', query.tags.join(','));
    if (query?.search) params.set('search', query.search);
    if (query?.sortBy) params.set('sortBy', query.sortBy);
    if (query?.sortOrder) params.set('sortOrder', query.sortOrder);
    const qs = params.toString();
    return apiRequest(`/v1/blog/admin/posts${qs ? `?${qs}` : ''}`);
  },
  createPost: async (
    body: Partial<import('@/types/api').BlogPost>
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').BlogPost>
  > => {
    return apiRequest('/v1/blog/admin/posts', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updatePost: async (
    id: string,
    body: Partial<import('@/types/api').BlogPost>
  ): Promise<
    import('@/types/api').ApiResponse<import('@/types/api').BlogPost>
  > => {
    return apiRequest(`/v1/blog/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deletePost: async (
    id: string
  ): Promise<import('@/types/api').ApiResponse<void>> => {
    return apiRequest(`/v1/blog/admin/posts/${id}`, { method: 'DELETE' });
  },
};
