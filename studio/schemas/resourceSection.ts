import { defineType, defineField } from "sanity";

export const resourceSection = defineType({
  name: "resourceSection",
  title: "Resource section",
  type: "document",
  description: "Resources appear in this section when you set 'Section' on the Resource (or choose this section when uploading). No need to add them here manually.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g. Video Content, Service Flows, Small Group Guides",
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
    select: { title: "title" },
    prepare({ title }) {
      return {
        title: title || "Untitled section",
      };
    },
  },
});
