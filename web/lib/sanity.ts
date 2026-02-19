import { unstable_cache } from "next/cache";
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

const collectionResourceFields = `
  _id,
  title,
  description,
  fileType,
  s3Key,
  _createdAt
`;

export const featuredCollectionsQuery = `*[_type == "resourceCollection" && featured == true] | order(_createdAt desc) { ${collectionFields} }`;
export const allCollectionsQuery = `*[_type == "resourceCollection"] | order(_createdAt desc) { ${collectionFields} }`;

export function collectionBySlugQuery() {
  return `*[_type == "resourceCollection" && slug.current == $slug][0]{
    ${collectionFields},
    "resources": resources[]->{ ${collectionResourceFields} } | order(_createdAt desc)
  }`;
}

export function collectionByIdQuery() {
  return `*[_type == "resourceCollection" && _id == $id][0]{
    ${collectionFields},
    "resources": resources[]->{ ${collectionResourceFields} } | order(_createdAt desc)
  }`;
}

export function resourceByIdQuery() {
  return `*[_type == "resource" && _id == $id][0]{ ${resourceFields} }`;
}

export async function getFeaturedCollections() {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<Record<string, unknown>>>(featuredCollectionsQuery);
}

/** Deterministic shuffle using a string seed (e.g. date). Same seed => same order. */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  const rng = () => {
    hash = (hash * 16807) % 2147483647;
    return hash / 2147483647;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Featured collections for home page with daily rotation. Picks from admin-marked featured pool, rotates which 6 are shown each day. */
export async function getFeaturedCollectionsForHome(limit = 6) {
  const today = new Date().toISOString().slice(0, 10);
  return unstable_cache(
    async () => {
      if (!projectId || projectId === "placeholder") return [];
      const all = await sanityClient.fetch<Array<Record<string, unknown>>>(featuredCollectionsQuery);
      if (all.length <= limit) return all;
      return seededShuffle(all, today).slice(0, limit);
    },
    ["featured-for-home", today, String(limit)],
    { revalidate: 3600 }
  )();
}

export async function getRecentlyAddedCollections(limit = 6) {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch<Array<Record<string, unknown>>>(
    `*[_type == "resourceCollection"] | order(_createdAt desc)[0...$limit] { ${collectionFields} }`,
    { limit }
  );
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

/** Get collection resources in document order (for admin manage). */
export async function getCollectionResourcesForAdmin(
  collectionId: string
): Promise<Array<Record<string, unknown>>> {
  if (!projectId || projectId === "placeholder") return [];
  const doc = await sanityClient.fetch<{ resources?: Array<Record<string, unknown>> } | null>(
    `*[_type == "resourceCollection" && _id == $id][0]{ "resources": resources[]->{ _id, title, description, fileType } }`,
    { id: collectionId }
  );
  return (doc?.resources ?? []) as Array<Record<string, unknown>>;
}

export async function getResourceById(id: string) {
  if (!projectId || projectId === "placeholder") return null;
  return sanityClient.fetch<Record<string, unknown> | null>(resourceByIdQuery(), { id });
}

const downloadableFields = `_id, title, description, fileType`;

/** Get resource or collectionResource docs by IDs (for My Resources). Preserves order of ids. */
export async function getResourcesByIds(ids: string[]): Promise<Array<Record<string, unknown>>> {
  if (!projectId || projectId === "placeholder" || !ids.length) return [];
  const distinct = [...new Set(ids)];
  const docs = await sanityClient.fetch<Array<Record<string, unknown>>>(
    `*[_type in ["resource", "collectionResource"] && _id in $ids]{ ${downloadableFields} }`,
    { ids: distinct }
  );
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Array<Record<string, unknown>>;
}

const savedItemFields = `
  _id,
  _type,
  title,
  description,
  fileType,
  "heroImage": heroImage.asset->url,
  "slug": slug.current
`;

/** Get saved items (resources, collectionResources, or collections) by IDs. Preserves order. */
export async function getSavedItemsByIds(ids: string[]): Promise<Array<Record<string, unknown>>> {
  if (!projectId || projectId === "placeholder" || !ids.length) return [];
  const distinct = [...new Set(ids)];
  const docs = await sanityClient.fetch<Array<Record<string, unknown>>>(
    `*[_type in ["resource", "collectionResource", "resourceCollection"] && _id in $ids]{ ${savedItemFields} }`,
    { ids: distinct }
  );
  const byId = new Map(docs.map((d) => [String(d._id), d]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as Array<Record<string, unknown>>;
}

/** Get resource or collectionResource by id (for download). Returns doc with s3Key if found. */
export async function getDownloadableById(id: string): Promise<{ s3Key: string } | null> {
  if (!projectId || projectId === "placeholder") return null;
  const doc = await sanityClient.fetch<{ s3Key?: string } | null>(
    `*[_type in ["resource", "collectionResource"] && _id == $id][0]{ s3Key }`,
    { id }
  );
  return doc?.s3Key && typeof doc.s3Key === "string" ? { s3Key: doc.s3Key } : null;
}

/** Build a match pattern for GROQ text search (case-insensitive contains). */
function searchPattern(q: string): string {
  const trimmed = q.trim().replace(/\*/g, "").toLowerCase();
  if (!trimmed) return "";
  return `*${trimmed}*`;
}

/** Search collections and standalone resources. Collection items (collectionResource) are not searched—only visible inside their collection. */
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
  const [collections, resources] = await Promise.all([
    sanityClient.fetch<Array<Record<string, unknown>>>(
      `*[_type == "resourceCollection" && (lower(title) match $pattern || (description != null && lower(description) match $pattern))] | order(title asc) { ${collectionFields} }`,
      { pattern }
    ),
    sanityClient.fetch<Array<Record<string, unknown>>>(
      `*[_type == "resource" && (lower(title) match $pattern || (description != null && lower(description) match $pattern))] | order(title asc) { ${resourceFields} }`,
      { pattern }
    ),
  ]);
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

/** Create a collection resource (file item inside a collection). No section—only belongs to collections. */
export async function createCollectionResource(params: {
  title: string;
  s3Key: string;
  fileType?: string;
  description?: string;
}): Promise<string | null> {
  if (!sanityClientWithToken) return null;
  const doc = await sanityClientWithToken.create({
    _type: "collectionResource",
    title: params.title,
    s3Key: params.s3Key,
    ...(params.fileType && { fileType: params.fileType }),
    ...(params.description && { description: params.description }),
  });
  return doc._id ?? null;
}

/** Create a new resource collection (requires SANITY_API_TOKEN). Uses collectionResource IDs, not resource. */
export async function createResourceCollection(params: {
  title: string;
  sectionId: string;
  collectionResourceIds: string[];
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
    resources: params.collectionResourceIds.map((id) => ({ _type: "reference", _ref: id, _key: id })),
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

/** Internal: fetch sections from Sanity (uncached). */
async function fetchSectionsForSidebar(): Promise<Array<{ _id: string; title: string; slug: string }>> {
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

/** List all resource sections for sidebar (cached 60s). Includes slug for /section/[slug] links. */
export async function getSectionsForSidebar(): Promise<Array<{ _id: string; title: string; slug: string }>> {
  return unstable_cache(fetchSectionsForSidebar, ["sections-for-sidebar"], { revalidate: 60 })();
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
export async function getCollectionsForSection(
  sectionId: string
): Promise<Array<{ _id: string; title: string; slug: string; description?: string; heroImage?: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  return sanityClient.fetch(
    `*[_type == "resourceCollection" && section._ref == $sectionId] | order(_createdAt desc, title asc) {
      _id,
      title,
      description,
      "slug": slug.current,
      "heroImage": heroImage.asset->url
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

/** Reorder resources in a collection. orderedIds = new order of collectionResource _ids. */
export async function reorderCollectionResources(
  collectionId: string,
  orderedIds: string[]
): Promise<boolean> {
  if (!sanityClientWithToken) return false;
  const refs = orderedIds.map((id) => ({ _type: "reference" as const, _ref: id, _key: id }));
  await sanityClientWithToken.patch(collectionId).set({ resources: refs }).commit();
  return true;
}

/** Set whether a collection is featured (for home page rotation). */
export async function setCollectionFeatured(
  collectionId: string,
  featured: boolean
): Promise<boolean> {
  if (!sanityClientWithToken) return false;
  await sanityClientWithToken.patch(collectionId).set({ featured }).commit();
  return true;
}

/** Update a collectionResource document (title, description, fileType). */
export async function updateCollectionResource(
  id: string,
  updates: { title?: string; description?: string; fileType?: string }
): Promise<boolean> {
  if (!sanityClientWithToken) return false;
  const set: Record<string, unknown> = {};
  if (updates.title !== undefined) set.title = updates.title;
  if (updates.description !== undefined) set.description = updates.description;
  if (updates.fileType !== undefined) set.fileType = updates.fileType;
  if (Object.keys(set).length === 0) return true;
  await sanityClientWithToken.patch(id).set(set).commit();
  return true;
}
