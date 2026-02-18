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
      title: "Hero image",
      type: "image",
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
      name: "category",
      title: "Category",
      type: "string",
      description: "e.g. Kids, Worship, Message Series (for sidebar/filter)",
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resourceSection" }] }],
      description: "Sections that contain resources (e.g. Video Content, PDFs)",
    }),
    defineField({
      name: "relatedCollections",
      title: "Related collections",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resourceCollection" }] }],
      description: "Optional: show at bottom of collection page",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Order for featured / listing (lower = first)",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
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
