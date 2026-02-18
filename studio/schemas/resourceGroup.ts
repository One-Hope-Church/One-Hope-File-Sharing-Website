import { defineType, defineField } from "sanity";

export const resourceGroup = defineType({
  name: "resourceGroup",
  title: "Resource group",
  type: "document",
  description: "A named set of resources (e.g. a pack) within a section. Created when you upload a group of files; you can also create one in Studio and add resources.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g. Easter 2024 Sermon Pack",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "section",
      title: "Section",
      type: "reference",
      to: [{ type: "resourceSection" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resources",
      title: "Resources",
      type: "array",
      of: [{ type: "reference", to: [{ type: "resource" }] }],
      description: "Resources in this group (same as setting Section on each resource).",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title" },
    prepare({ title }) {
      return { title: title || "Untitled group" };
    },
  },
});
