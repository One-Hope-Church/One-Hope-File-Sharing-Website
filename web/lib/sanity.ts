import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

export const sanityClient = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: true,
});

export const sanityClientWithToken = projectId && process.env.SANITY_API_TOKEN
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_API_TOKEN,
    })
  : null;

// GROQ fragments and queries
const collectionFields = `
  _id,
  title,
  "slug": slug.current,
  description,
  "heroImage": heroImage.asset->url,
  featured
`;

const resourceFields = `
  _id,
  title,
  description,
  fileType,
  s3Key,
  thumbnailUrl,
  order
`;

const resourceFieldsWithCreated = `
  _id,
  title,
  description,
  fileType,
  s3Key,
  thumbnailUrl,
  order,
  _createdAt
`;

export const featuredCollectionsQuery = `*[_type == "resourceCollection" && featured == true] | order(_createdAt desc) { ${collectionFields} }`;
export const allCollectionsQuery = `*[_type == "resourceCollection"] | order(_createdAt desc) { ${collectionFields} }`;

export function collectionBySlugQuery() {
  return `*[_type == "resourceCollection" && slug.current == $slug][0]{
    ${collectionFields},
    "resources": resources[]->{ ${resourceFieldsWithCreated} } | order(_createdAt desc)
  }`;
}

export function collectionByIdQuery() {
  return `*[_type == "resourceCollection" && _id == $id][0]{
    ${collectionFields},
    "resources": resources[]->{ ${resourceFieldsWithCreated} } | order(_createdAt desc)
  }`;
}

export function resourceByIdQuery() {
  return `*[_type == "resource" && _id == $id][0]{ ${resourceFields} }`;
}

export async function getFeaturedCollections() {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<Record<string, unknown>>>(featuredCollectionsQuery);
}

export async function getAllCollections() {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<Record<string, unknown>>>(allCollectionsQuery);
}

export async function getCollectionBySlug(slug: string) {
  if (!projectId || projectId === "placeholder") return null;
  return sanityClient.fetch<Record<string, unknown> | null>(collectionBySlugQuery(), { slug });
}

export async function getCollectionById(id: string) {
  if (!projectId || projectId === "placeholder") return null;
  return sanityClient.fetch<Record<string, unknown> | null>(collectionByIdQuery(), { id });
}

export async function getResourceById(id: string) {
  if (!projectId || projectId === "placeholder") return null;
  return sanityClient.fetch<Record<string, unknown> | null>(resourceByIdQuery(), { id });
}

/** Build a match pattern for GROQ text search (case-insensitive contains). */
function searchPattern(q: string): string {
  const trimmed = q.trim().replace(/\*/g, "").toLowerCase();
  if (!trimmed) return "";
  return `*${trimmed}*`;
}

/** Resource IDs that are referenced by at least one collection (so they are "in" a collection). */
async function getResourceIdsInCollections(): Promise<string[]> {
  if (!projectId || projectId === "placeholder") return [];
  const raw = await sanityClient.fetch<string[] | string[][]>(
    `array::unique(*[_type == "resourceCollection"].resources[]._ref)`
  );
  if (!Array.isArray(raw)) return [];
  const flat = raw.flat();
  return flat.filter((r): r is string => typeof r === "string");
}

/** Search collections and resources by title and description. Resources that belong to a collection are excluded (only visible inside the collection). */
export async function searchContent(q: string): Promise<{
  collections: Array<Record<string, unknown>>;
  resources: Array<Record<string, unknown>>;
}> {
  if (!projectId || projectId === "placeholder") {
    return { collections: [], resources: [] };
  }
  const pattern = searchPattern(q);
  if (!pattern) {
    return { collections: [], resources: [] };
  }
  const [collections, allMatchingResources, idsInCollections] = await Promise.all([
    sanityClient.fetch<Array<Record<string, unknown>>>(
      `*[_type == "resourceCollection" && (lower(title) match $pattern || (description != null && lower(description) match $pattern))] | order(title asc) { ${collectionFields} }`,
      { pattern }
    ),
    sanityClient.fetch<Array<Record<string, unknown>>>(
      `*[_type == "resource" && (lower(title) match $pattern || (description != null && lower(description) match $pattern))] | order(title asc) { ${resourceFields} }`,
      { pattern }
    ),
    getResourceIdsInCollections(),
  ]);
  const idsSet = new Set(idsInCollections);
  const resources = allMatchingResources.filter((r) => !idsSet.has(String(r._id)));
  return { collections, resources };
}

/** Create a resource document in Sanity (requires SANITY_API_TOKEN). Optionally set section so it appears in that section. */
export async function createResource(params: {
  title: string;
  description?: string;
  fileType?: string;
  s3Key: string;
  sectionId?: string;
  order?: number;
}): Promise<string | null> {
  if (!sanityClientWithToken) return null;
  const doc = await sanityClientWithToken.create({
    _type: "resource",
    title: params.title,
    ...(params.description && { description: params.description }),
    ...(params.fileType && { fileType: params.fileType }),
    s3Key: params.s3Key,
    ...(params.sectionId && { section: { _type: "reference", _ref: params.sectionId } }),
    order: params.order ?? 0,
  });
  return doc._id ?? null;
}

/** Create a resource group (requires SANITY_API_TOKEN). */
export async function createResourceGroup(params: {
  title: string;
  sectionId: string;
  resourceIds: string[];
  order?: number;
}): Promise<string | null> {
  if (!sanityClientWithToken || !params.resourceIds.length) return null;
  const doc = await sanityClientWithToken.create({
    _type: "resourceGroup",
    title: params.title,
    section: { _type: "reference", _ref: params.sectionId },
    resources: params.resourceIds.map((id) => ({ _type: "reference", _ref: id, _key: id })),
    order: params.order ?? 0,
  });
  return doc._id ?? null;
}

/** Create a new resource collection (requires SANITY_API_TOKEN). Slug is derived from title; made unique if needed. */
export async function createResourceCollection(params: {
  title: string;
  sectionId: string;
  resourceIds: string[];
  description?: string;
}): Promise<string | null> {
  if (!sanityClientWithToken) return null;
  let slug = collectionSlugFromTitle(params.title);
  const existing = await sanityClientWithToken.fetch<{ _id: string } | null>(
    `*[_type == "resourceCollection" && slug.current == $slug][0]{ _id }`,
    { slug }
  );
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }
  const doc = await sanityClientWithToken.create({
    _type: "resourceCollection",
    title: params.title,
    slug: { _type: "slug", current: slug },
    section: { _type: "reference", _ref: params.sectionId },
    resources: params.resourceIds.map((id) => ({ _type: "reference", _ref: id, _key: id })),
    ...(params.description && { description: params.description }),
  });
  return doc._id ?? null;
}

/** List all resource sections for admin dropdown (id + title). */
export async function getSectionsForAdmin(): Promise<Array<{ _id: string; title: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  const query = `*[_type == "resourceSection"] | order(title asc) { _id, title }`;
  return sanityClient.fetch<Array<{ _id: string; title: string }>>(query);
}

/** Slugify a title for use as URL slug. */
function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

/** Slug for a collection (same logic, fallback "collection"). */
function collectionSlugFromTitle(title: string): string {
  const s = slugFromTitle(title);
  return s || "collection";
}

/** List all resource sections for sidebar (ordered by order, then title). Includes slug for /section/[slug] links. */
export async function getSectionsForSidebar(): Promise<Array<{ _id: string; title: string; slug: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  const query = `*[_type == "resourceSection"] | order(order asc, title asc) { _id, title, "slug": slug.current }`;
  return sanityClient.fetch<Array<{ _id: string; title: string; slug: string | null }>>(query).then((list) =>
    list.map((s) => ({
      _id: s._id,
      title: s.title ?? "Untitled",
      slug: s.slug && s.slug.trim() ? s.slug : slugFromTitle(s.title ?? "section"),
    }))
  );
}

/** Get a section by slug (for /section/[slug] page). Resolves by stored slug or by title-derived slug when section has no slug set. */
export async function getSectionBySlug(slug: string): Promise<{ _id: string; title: string; slug: string } | null> {
  if (!projectId || projectId === "placeholder") return null;
  const list = await sanityClient.fetch<Array<{ _id: string; title: string; slug: string | null }>>(
    `*[_type == "resourceSection"]{ _id, title, "slug": slug.current }`
  );
  const normalized = slug.toLowerCase().trim();
  const found =
    list.find((s) => s.slug && s.slug.toLowerCase() === normalized) ??
    list.find((s) => slugFromTitle(s.title ?? "") === normalized);
  if (!found) return null;
  return {
    _id: found._id,
    title: found.title ?? "Untitled",
    slug: found.slug && found.slug.trim() ? found.slug : slugFromTitle(found.title ?? "section"),
  };
}

/** Collections that belong to this section (parent section ref). */
export async function getCollectionsForSection(sectionId: string): Promise<Array<{ _id: string; title: string; slug: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<{ _id: string; title: string; slug: string }>>(
    `*[_type == "resourceCollection" && section._ref == $sectionId] | order(_createdAt desc, title asc) {
      _id,
      title,
      "slug": slug.current
    }`,
    { sectionId }
  );
}

/** Resources that belong to this section. */
export async function getResourcesForSection(sectionId: string): Promise<Array<Record<string, unknown>>> {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<Record<string, unknown>>>(
    `*[_type == "resource" && section._ref == $sectionId] | order(order asc) { ${resourceFields} }`,
    { sectionId }
  );
}

/** Resources in this section that are not in any collection (standalone only). Resources in a collection are only shown on the collection page. */
export async function getStandaloneResourcesForSection(sectionId: string): Promise<Array<Record<string, unknown>>> {
  if (!projectId || projectId === "placeholder") return [];
  const [allInSection, idsInCollections] = await Promise.all([
    sanityClient.fetch<Array<Record<string, unknown>>>(
      `*[_type == "resource" && section._ref == $sectionId] | order(order asc) { ${resourceFields} }`,
      { sectionId }
    ),
    getResourceIdsInCollections(),
  ]);
  const idsSet = new Set(idsInCollections);
  return allInSection.filter((r) => !idsSet.has(String(r._id)));
}

/** Upload an image asset to Sanity (requires SANITY_API_TOKEN). Returns asset _id or null. */
export async function uploadImageAsset(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string | null> {
  if (!sanityClientWithToken) return null;
  const asset = await sanityClientWithToken.assets.upload("image", buffer, {
    filename,
    contentType: contentType.startsWith("image/") ? contentType : "image/jpeg",
  });
  return asset._id ?? null;
}

/** Set a collection's hero/cover image (requires SANITY_API_TOKEN). */
export async function setCollectionHeroImage(
  collectionId: string,
  assetId: string
): Promise<boolean> {
  if (!sanityClientWithToken) return false;
  await sanityClientWithToken
    .patch(collectionId)
    .set({
      heroImage: {
        _type: "image",
        asset: { _type: "reference", _ref: assetId },
      },
    })
    .commit();
  return true;
}

/** Append resource IDs to a collection's resources array (requires SANITY_API_TOKEN). */
export async function appendResourcesToCollection(
  collectionId: string,
  resourceIds: string[]
): Promise<boolean> {
  if (!sanityClientWithToken || !resourceIds.length) return false;
  const doc = await sanityClientWithToken.fetch<{ resources?: string[] } | null>(
    `*[_type == "resourceCollection" && _id == $id][0]{ "resources": resources[]._ref }`,
    { id: collectionId }
  );
  const existingRefs = (doc?.resources ?? []) as string[];
  const existing = existingRefs.map((ref) => ({ _type: "reference" as const, _ref: ref, _key: ref }));
  const newRefs = resourceIds.map((id) => ({ _type: "reference" as const, _ref: id, _key: id }));
  await sanityClientWithToken
    .patch(collectionId)
    .set({ resources: [...existing, ...newRefs] })
    .commit();
  return true;
}
