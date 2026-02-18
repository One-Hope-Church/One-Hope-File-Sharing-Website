import { defineType, defineField } from "sanity";

export const resourceCollection = defineType({
  name: "resourceCollection",
  title: "Resource collection",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "heroImage",
      title: "Hero / cover image",
      type: "image",
      description:
        "Square (1:1) works best. Recommended: 1200×1200 px. Minimum 800×800 px. JPEG, PNG, or WebP.",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      description: "Show on the home page featured carousel",
      initialValue: false,
    }),
    defineField({
      name: "section",
      title: "Parent section",
      type: "reference",
      to: [{ type: "resourceSection" }],
      description: "Section in the sidebar under which this collection appears (hierarchy: Sections → Collections).",
    }),
    defineField({
      name: "resources",
      title: "Resources",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resource" }] }],
      description: "Resources in this collection. Shown in upload date order (newest first).",
    }),
    defineField({
      name: "relatedCollections",
      title: "Related collections",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resourceCollection" }] }],
      description: "Optional: show at bottom of collection page",
    }),
  ],
  orderings: [
    { title: "Newest first", name: "createdDesc", by: [{ field: "_createdAt", direction: "desc" }] },
    { title: "Title", name: "titleAsc", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare({ title, slug }) {
      return {
        title: title || "Untitled collection",
        subtitle: slug ? `/${slug}` : undefined,
      };
    },
  },
});
