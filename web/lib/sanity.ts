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
  featured,
  category,
  order
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

// Groups and resources in section; resources = standalone (not in any group) + groups (each with resources)
const sectionFields = `
  _id,
  title,
  order,
  "groups": *[_type == "resourceGroup" && section._ref == ^._id] | order(order asc) {
    _id,
    title,
    order,
    "resources": resources[]->{ ${resourceFields} }
  },
  "allResources": *[_type == "resource" && section._ref == ^._id] | order(order asc) { ${resourceFields} }
`;

export const featuredCollectionsQuery = `*[_type == "resourceCollection" && featured == true] | order(order asc) { ${collectionFields} }`;
export const allCollectionsQuery = `*[_type == "resourceCollection"] | order(order asc) { ${collectionFields} }`;

export function collectionBySlugQuery() {
  return `*[_type == "resourceCollection" && slug.current == $slug][0]{
    ${collectionFields},
    sections[]->{ ${sectionFields} }
  }`;
}

export function collectionByIdQuery() {
  return `*[_type == "resourceCollection" && _id == $id][0]{
    ${collectionFields},
    sections[]->{ ${sectionFields} }
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
    resources: params.resourceIds.map((id) => ({ _type: "reference", _ref: id })),
    order: params.order ?? 0,
  });
  return doc._id ?? null;
}

/** List all resource sections for admin dropdown (id + title). */
export async function getSectionsForAdmin(): Promise<Array<{ _id: string; title: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  const query = `*[_type == "resourceSection"] | order(title asc) { _id, title }`;
  return sanityClient.fetch<Array<{ _id: string; title: string }>>(query);
}

/** List all resource sections for sidebar (ordered by order, then title). */
export async function getSectionsForSidebar(): Promise<Array<{ _id: string; title: string }>> {
  if (!projectId || projectId === "placeholder") return [];
  const query = `*[_type == "resourceSection"] | order(order asc, title asc) { _id, title }`;
  return sanityClient.fetch<Array<{ _id: string; title: string }>>(query);
}
