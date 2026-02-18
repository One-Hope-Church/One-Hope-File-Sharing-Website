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

const sectionFields = `
  _id,
  title,
  order,
  resources[]->{ ${resourceFields} }
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
