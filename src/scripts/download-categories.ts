import fs from "node:fs";
import path from "node:path";
import { prisma } from "../prisma/index";
import { env } from "../configs/env";

interface ShopifyCollectionNode {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: {
    url: string;
  } | null;
  products: {
    edges: {
      node: {
        id: string;
      };
    }[];
  };
}

async function fetchShopifyCollectionsWithProducts(): Promise<ShopifyCollectionNode[]> {
  const domain = env.SHOPIFY_STORE_DOMAIN;
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  const query = `
    query GetCollections {
      collections(first: 250) {
        edges {
          node {
            id
            title
            handle
            description
            image {
              url
            }
            products(first: 250) {
              edges {
                node {
                  id
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(
    `https://${domain}/admin/api/2026-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = (await response.json()) as any;

  if (data.errors) {
    console.error(data.errors);
    throw new Error("Failed to fetch collections from Shopify");
  }

  const collectionsConnection = data.data?.collections;
  if (!collectionsConnection?.edges) {
    return [];
  }

  return collectionsConnection.edges.map((edge: any) => edge.node);
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  console.log("Fetching categories (collections) from Shopify...");
  const rawCollections = await fetchShopifyCollectionsWithProducts();

  // Filter out collections that represent categories (not collections / collectible art)
  const filteredCategories = rawCollections.filter((c) => {
    const title = c.title?.toLowerCase().trim() || "";
    const isExcludedHandle = ["enigma", "frontpage", "the-cascade-earrings"].includes(c.handle);
    
    return !(
      title.endsWith("collection") ||
      title.endsWith("collections") ||
      title === "collectible art"
    ) && !isExcludedHandle;
  });

  console.log(`Found ${filteredCategories.length} categories matching filter.`);

  // Create local upload folder if it doesn't exist
  const uploadDir = path.join(process.cwd(), "public", "uploads", "categories");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  for (const c of filteredCategories) {
    console.log(`Processing category: "${c.title}"...`);
    let localImagePath: string | null = null;

    if (c.image?.url) {
      try {
        // Extract original extension from Shopify URL (remove query parameters)
        const baseUrl = c.image.url.split("?")[0];
        const ext = path.extname(baseUrl) || ".jpg";
        
        // Save using the exact category name
        const filename = `${c.title}${ext}`;
        const localPath = path.join(uploadDir, filename);

        console.log(`Downloading image for "${c.title}" to ${localPath}...`);
        await downloadImage(c.image.url, localPath);
        
        // Save relative path for database
        localImagePath = `/public/uploads/categories/${filename}`;
      } catch (err) {
        console.error(`Failed to download image for category "${c.title}":`, err);
      }
    }

    // 1. Upsert the Category in database
    const dbCategory = await prisma.category.upsert({
      where: { handle: c.handle },
      update: {
        name: c.title,
        description: c.description || null,
        image: localImagePath,
      },
      create: {
        name: c.title,
        handle: c.handle,
        description: c.description || null,
        image: localImagePath,
      },
    });

    console.log(`Seeded category "${dbCategory.name}" (ID: ${dbCategory.id})`);

    // 2. Link products in this category
    const shopifyProductIds = c.products?.edges?.map((edge) => edge.node.id.split("/").pop() || "") || [];
    console.log(`Linking ${shopifyProductIds.length} products to category "${dbCategory.name}"...`);

    // Clear existing links for this category
    await prisma.productCategory.deleteMany({
      where: { categoryId: dbCategory.id },
    });

    for (const rawProductId of shopifyProductIds) {
      if (!rawProductId) continue;

      // Ensure product exists in ProductData database table to respect foreign key constraint
      await prisma.productData.upsert({
        where: { id: rawProductId },
        update: {},
        create: {
          id: rawProductId,
          isActive: true,
        },
      });

      // Link product to category
      await prisma.productCategory.create({
        data: {
          productId: rawProductId,
          categoryId: dbCategory.id,
        },
      });
    }
  }

  console.log("Seeding categories completed successfully!");
}

main()
  .catch((err) => {
    console.error("Error in category seed script:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
