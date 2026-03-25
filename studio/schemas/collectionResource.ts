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
          { title: "Word", value: "word" },
          { title: "Adobe Design (PS/AI/INDD)", value: "design" },
          { title: "ZIP", value: "zip" },
          { title: "Other", value: "other" },
        ],
        layout: "dropdown",
      },
    }),
    defineField({
      name: "s3Key",
      title: "S3 key",
      description:
        "Path in the S3 bucket for an uploaded file. Leave empty if you use an external link instead.",
      type: "string",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { externalUrl?: string };
          const s3 = typeof value === "string" ? value.trim() : "";
          const ext =
            typeof parent?.externalUrl === "string" ? parent.externalUrl.trim() : "";
          if (!s3 && !ext) {
            return "Add either an S3 key (uploaded file) or an external link";
          }
          return true;
        }),
    }),
    defineField({
      name: "externalUrl",
      title: "External link",
      description:
        "Optional alternative to a file: any https (or http) URL — video hosts, docs, forms, etc.",
      type: "url",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { s3Key?: string };
          const s3 = typeof parent?.s3Key === "string" ? parent.s3Key.trim() : "";
          const ext = typeof value === "string" ? value.trim() : "";
          if (ext) {
            try {
              const u = new URL(ext);
              if (u.protocol !== "http:" && u.protocol !== "https:") {
                return "Use http or https only";
              }
            } catch {
              return "Enter a valid URL";
            }
          }
          if (!s3 && !ext) {
            return "Add either an uploaded file (S3 key) or an external link";
          }
          return true;
        }),
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
