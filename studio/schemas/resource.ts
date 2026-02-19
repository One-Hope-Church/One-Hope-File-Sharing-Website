import { defineType, defineField } from "sanity";

export const resource = defineType({
  name: "resource",
  title: "Resource",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "fileType",
      title: "File type",
      type: "string",
      options: {
        list: [
          { title: "PDF", value: "pdf" },
          { title: "Video", value: "video" },
          { title: "Image", value: "image" },
          { title: "ZIP", value: "zip" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
    }),
    defineField({
      name: "s3Key",
      title: "S3 key",
      description: "Path in the S3 bucket (e.g. collections/abc123/file.pdf)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "thumbnailUrl",
      title: "Thumbnail URL",
      description: "Optional image URL for the card",
      type: "url",
    }),
    defineField({
      name: "section",
      title: "Section",
      type: "reference",
      to: [{ type: "resourceSection" }],
      description: "Which section this resource appears in. Resources show up in a section automatically when this is set.",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Order within the section (lower = first)",
      initialValue: 0,
    }),
  ],
  orderings: [
    { title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", fileType: "fileType" },
    prepare({ title, fileType }) {
      return {
        title: title || "Untitled",
        subtitle: fileType ? `(${fileType})` : undefined,
      };
    },
  },
});
