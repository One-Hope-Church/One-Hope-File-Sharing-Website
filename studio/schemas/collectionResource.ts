import { defineType, defineField } from "sanity";

/**
 * A file/item that belongs only to a collection. Unlike "Resource" (standalone),
 * these are managed inside collections and never appear in sections or search.
 */
export const collectionResource = defineType({
  name: "collectionResource",
  title: "Collection resource",
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
      description: "Path in the S3 bucket (e.g. collections/uploads/file.pdf)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", fileType: "fileType" },
    prepare({ title, fileType }) {
      return {
        title: title || "Untitled",
        subtitle: fileType ? `(${fileType})` : "Collection item",
      };
    },
  },
});
