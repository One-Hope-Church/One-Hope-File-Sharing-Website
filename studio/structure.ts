import type { StructureResolver } from "sanity/structure";

/**
 * Sidebar structure like Highlands: Resource collections, then each Section
 * as its own sidebar row (Prayer, Message Series, etc.), then "All sections"
 * to create/manage, then Resources and Groups.
 */
export const structure: StructureResolver = async (S, context) => {
  const client = context.getClient({ apiVersion: "2024-01-01" });
  const sections = await client.fetch<{ _id: string; title: string | null }[]>(
    `*[_type == "resourceSection"] | order(order asc, title asc){ _id, title }`
  );

  const sectionItems = sections.map((sec) =>
    S.listItem()
      .id(sec._id)
      .title(sec.title || "Untitled section")
      .schemaType("resourceSection")
      .child(S.document().documentId(sec._id).schemaType("resourceSection"))
  );

  return S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Resource collections")
        .id("resourceCollections")
        .child(
          S.documentTypeList("resourceCollection").title("Resource collections")
        ),
      S.divider(),
      ...sectionItems,
      S.listItem()
        .title("All sections")
        .id("allSections")
        .child(
          S.documentList()
            .title("All sections")
            .schemaType("resourceSection")
            .filter("_type == $type")
            .params({ type: "resourceSection" })
            .defaultOrdering([
              { field: "order", direction: "asc" },
              { field: "title", direction: "asc" },
            ])
        ),
      S.divider(),
      S.documentTypeListItem("resource").title("Resources"),
      S.documentTypeListItem("collectionResource").title("Collection resources"),
      S.documentTypeListItem("resourceGroup").title("Resource groups"),
    ]);
};
