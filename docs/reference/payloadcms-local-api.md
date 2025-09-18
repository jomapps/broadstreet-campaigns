# PayloadCMS Local API Reference

## Overview

The PayloadCMS Local API allows you to interact with your Payload instance directly from within your application, bypassing HTTP requests. This is particularly useful for server-side operations in Next.js pages.

## Key Concepts

### Local API vs REST API

**REST API (HTTP)**:
```typescript
// Makes HTTP request
const response = await fetch('/api/collections/users');
const users = await response.json();
```

**Local API (Direct)**:
```typescript
// Direct database access
const users = await payload.find({
  collection: 'users',
});
```

### Benefits

1. **Performance**: No HTTP overhead, direct database access
2. **Server-Side**: Perfect for Next.js server components and API routes
3. **Type Safety**: Full TypeScript support with generated types
4. **Security**: No exposure of sensitive operations via HTTP
5. **Transactions**: Support for database transactions

## Implementation Pattern for Next.js

### Server Component Pattern

```typescript
// app/users/page.tsx
import { getPayload } from 'payload';
import config from '@payload-config';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // 1. Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // 2. Get Payload instance
  const payload = await getPayload({ config });
  
  // 3. Fetch data using Local API
  const users = await payload.find({
    collection: 'users',
    where: {
      status: { equals: 'active' }
    },
    limit: parseInt(params.limit as string) || 10,
    page: parseInt(params.page as string) || 1,
  });
  
  // 4. Pass data to client component
  return <UsersClient users={users} />;
}
```

### API Route Pattern

```typescript
// app/api/users/route.ts
import { getPayload } from 'payload';
import config from '@payload-config';

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  
  const users = await payload.find({
    collection: 'users',
  });
  
  return Response.json(users);
}
```

## Common Operations

### Find Documents

```typescript
const results = await payload.find({
  collection: 'posts',
  where: {
    status: { equals: 'published' },
    author: { equals: userId },
  },
  sort: '-createdAt',
  limit: 10,
  page: 1,
});
```

### Find by ID

```typescript
const post = await payload.findByID({
  collection: 'posts',
  id: postId,
});
```

### Create Document

```typescript
const newPost = await payload.create({
  collection: 'posts',
  data: {
    title: 'New Post',
    content: 'Post content...',
    author: userId,
    status: 'draft',
  },
});
```

### Update Document

```typescript
const updatedPost = await payload.update({
  collection: 'posts',
  id: postId,
  data: {
    title: 'Updated Title',
    status: 'published',
  },
});
```

### Delete Document

```typescript
await payload.delete({
  collection: 'posts',
  id: postId,
});
```

## Advanced Features

### Transactions

```typescript
await payload.db.beginTransaction();
try {
  const user = await payload.create({
    collection: 'users',
    data: userData,
  });
  
  await payload.create({
    collection: 'profiles',
    data: { ...profileData, user: user.id },
  });
  
  await payload.db.commitTransaction();
} catch (error) {
  await payload.db.rollbackTransaction();
  throw error;
}
```

### Hooks and Access Control

```typescript
// Hooks still apply with Local API
const posts = await payload.find({
  collection: 'posts',
  // Access control and hooks are automatically applied
});
```

### File Operations

```typescript
// Upload file
const media = await payload.create({
  collection: 'media',
  data: {
    alt: 'Image description',
  },
  file: fileBuffer, // or file path
});
```

## Error Handling

```typescript
try {
  const result = await payload.find({
    collection: 'posts',
  });
} catch (error) {
  if (error.name === 'ValidationError') {
    // Handle validation errors
  } else if (error.name === 'NotFound') {
    // Handle not found errors
  } else {
    // Handle other errors
  }
}
```

## Best Practices

1. **Initialize Once**: Get payload instance once per request
2. **Error Handling**: Always wrap in try-catch blocks
3. **Type Safety**: Use generated types for collections
4. **Performance**: Use `select` to limit returned fields
5. **Security**: Local API respects access control rules

## Integration with Our Architecture

For our Broadstreet Campaigns app, we can adapt this pattern:

```typescript
// Instead of direct MongoDB calls
const zones = await LocalZone.find({ synced_with_api: false });

// We would use Local API pattern
const zones = await payload.find({
  collection: 'localZones',
  where: {
    synced_with_api: { equals: false }
  }
});
```

This provides better structure, validation, and maintainability while keeping the server-side data fetching approach.
