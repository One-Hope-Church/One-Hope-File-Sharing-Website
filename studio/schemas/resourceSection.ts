import { defineType, defineField } from "sanity";

export const resourceSection = defineType({
  name: "resourceSection",
  title: "Resource section",
  type: "document",
  description: "Top-level section in the sidebar (e.g. Prayer, Message Series). Each section can contain collections and resources.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g. Prayer, Message Series, Students",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL slug for this section (e.g. prayer → /section/prayer)",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Order of this section within the collection",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", slug: "slug.current" },
    prepare({ title, slug }) {
      return {
        title: title || "Untitled section",
        subtitle: slug ? `/${slug}` : undefined,
      };
    },
  },
});
