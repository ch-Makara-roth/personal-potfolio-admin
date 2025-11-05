# Admin API

Base Path: `/api/v1`

Authentication:

- All admin endpoints require a valid JWT in the `Authorization` header as `Bearer <token>`.
- The authenticated user must have role `ADMIN`.

Rate Limiting:

- Admin endpoints generally use `auth` or `general` rate limiters as configured per route.

Notes:

- Validation uses Joi. Below, each endpoint lists required `params`, `query`, and `body` schemas.
- Response shapes are defined by controllers; typical responses use `{ success: boolean, data?: any, error?: { code: string, message: string } }`.

## Blog (Admin)

Router base: `/api/v1/blog`

- GET `/admin/posts`
  - Auth: Admin
  - Query: `blogPostQuerySchema`
    - `page` (int >=1, optional)
    - `limit` (int 1-100, optional)
    - `status` (`DRAFT|PUBLISHED|ARCHIVED`, optional)
    - `authorId` (uuid, optional)
    - `tags` (string or array of strings, optional)
    - `search` (string 1-100, optional)
    - `sortBy` (`createdAt|updatedAt|title|publishedAt|likes|views|readingTime`, optional)
    - `sortOrder` (`asc|desc`, optional)

- POST `/admin/posts`
  - Auth: Admin
  - Body: `createBlogPostSchema`
    - `title` (string 3-200, required)
    - `content` (string 10-50000, required)
    - `excerpt` (string <=500, optional)
    - `slug` (lowercase hyphenated string <=100, optional)
    - `status` (`DRAFT|PUBLISHED|ARCHIVED`, optional)
    - `tags` (array of 1-10 strings each 1-50, required)
    - `imageUrl` (uri, optional)
    - `readingTime` (int 1-1000, optional)
    - `likes` (int >=0, optional)
    - `views` (int >=0, optional)
    - `metaTitle` (string <=60, optional)
    - `metaDescription` (string <=160, optional)

- PUT `/admin/posts/:id`
  - Auth: Admin
  - Params: `blogPostParamsSchema`
    - `id` (uuid, required)
  - Body: `updateBlogPostSchema` (same fields as create, all optional)

- DELETE `/admin/posts/:id`
  - Auth: Admin
  - Params: `blogPostParamsSchema`
    - `id` (uuid, required)

- GET `/admin/comments`
  - Auth: Admin
  - Query: `commentQuerySchema`
    - `page` (int >=1, optional)
    - `limit` (int 1-100, optional)
    - `status` (`PENDING|APPROVED|REJECTED|SPAM`, optional)
    - `postId` (uuid, optional)
    - `authorEmail` (email, optional)
    - `search` (string 1-100, optional)
    - `sortBy` (`createdAt|updatedAt|authorName|authorEmail`, optional)
    - `sortOrder` (`asc|desc`, optional)

- PUT `/admin/comments/:id`
  - Auth: Admin
  - Params: `commentParamsSchema`
    - `id` (uuid, required)
  - Body: `updateCommentSchema`
    - `content` (string 3-1000, optional)
    - `authorName` (string 2-100, optional)
    - `authorEmail` (email, optional)
    - `authorUrl` (uri, optional)
    - `status` (`PENDING|APPROVED|REJECTED|SPAM`, optional)

- DELETE `/admin/comments/:id`
  - Auth: Admin
  - Params: `commentParamsSchema`
    - `id` (uuid, required)

## Contact (Admin)

Router base: `/api/v1/contact`

- GET `/admin`
  - Auth: Admin
  - Query: `contactQuerySchema`
    - `page` (int >=1, optional)
    - `limit` (int 1-100, optional)
    - `status` (`UNREAD|READ|REPLIED|ARCHIVED`, optional)
    - `search` (string 1-100, optional)
    - `sortBy` (`createdAt|updatedAt|name|email|status`, optional)
    - `sortOrder` (`asc|desc`, optional)
    - `dateFrom` (ISO date, optional)
    - `dateTo` (ISO date, optional)

- GET `/admin/stats`
  - Auth: Admin
  - Query: none

- GET `/admin/:id`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)

- PUT `/admin/:id`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)
  - Body: `updateContactSchema`
    - `name` (string 2-100, optional)
    - `email` (email, optional)
    - `subject` (string 3-200, optional)
    - `message` (string 10-2000, optional)
    - `phone` (E.164-like string, optional)
    - `company` (string 2-100, optional)
    - `website` (http/https uri, optional)
    - `budget` (string <=50, optional)
    - `timeline` (string <=100, optional)
    - `status` (`UNREAD|READ|REPLIED|ARCHIVED`, optional)
    - `notes` (string <=1000, optional)

- DELETE `/admin/:id`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)

- PATCH `/admin/:id/read`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)

- PATCH `/admin/:id/replied`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)
  - Body: `markAsRepliedSchema`
    - `notes` (string <=1000, optional)

- PATCH `/admin/:id/archive`
  - Auth: Admin
  - Params: `contactIdParamsSchema`
    - `id` (uuid, required)

## Authentication Details

- Header: `Authorization: Bearer <JWT>`
- Token created via `/api/v1/auth/login` or OAuth. Admin role assignment is managed server-side; see scripts or admin creation flow.

## Error Codes (examples)

- `AUTH_REQUIRED`: Missing or invalid token
- `FORBIDDEN`: Insufficient role
- `VALIDATION_ERROR`: Request body/params/query failed validation
- `NOT_FOUND`: Resource not found

## Integration Tips

- Always send `Content-Type: application/json` for JSON bodies.
- Respect rate limits; implement exponential backoff for `429` responses.
- Use pagination via `page` and `limit` when listing resources.
- For updates, send only changed fields; validators accept partial updates.
