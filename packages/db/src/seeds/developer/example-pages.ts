import fs from "fs";
import path from "path";
import { fileURLToPath } from "url"; // Added import
import matter from "gray-matter"; // Import gray-matter
import { db } from "../../index.js"; // Added .js extension
import * as schema from "../../schema/index.js"; // Changed to namespace import, added .js extension
import { eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url); // Added line
const __dirname = path.dirname(__filename); // Added line
const PAGES_ROOT_DIR = path.join(__dirname, "pages"); // Keep this line as it now works

/**
 * Recursively processes a Markdown file, extracting frontmatter and content,
 * and inserts it into the database if it doesn't already exist.
 */
async function processMarkdownFile(
  filePath: string,
  baseDir: string,
  userId: number
) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");

    // --- Determine Current Wiki Directory Path ---
    const relativeFileDir = path.dirname(path.relative(baseDir, filePath));
    let currentWikiDir = "/"; // Default to root
    if (relativeFileDir !== ".") {
      currentWikiDir = "/" + relativeFileDir.replace(/\\/g, "/");
    }
    // Ensure base URL for resolution has a trailing slash for correct relative resolution
    const baseWikiUrl =
      "http://dummy.com" +
      (currentWikiDir.endsWith("/") ? currentWikiDir : currentWikiDir + "/");
    // --------------------------------------------

    // --- Preprocess content: Fix links ---
    const linkRegex = /!?\[([^\]]*)\]\(([^)#]+)(#?[^)]*)\)/g; // Capture hash separately
    const modifiedFileContent = fileContent.replace(
      linkRegex,
      (match, text, url, hash) => {
        let newUrl = url;
        const originalHash = hash || ""; // Keep the hash part if it exists
        const originalUrlForWarning = url; // Keep original for warning messages

        // --- Skip External Links & Fragments ---
        if (/^[a-z]+:/i.test(url) || url.startsWith("#")) {
          return match; // Keep as is
        }

        // --- Handle /en/ Prefix ---
        let isEnStripped = false;
        if (url.startsWith("/en/")) {
          url = url.substring(3) || "/"; // Update url variable
          isEnStripped = true;
        }

        // --- Handle Different Link Types ---
        if (url.startsWith("/")) {
          // A. Absolute path: Keep as is, but normalize
          newUrl = url;
        } else if (url.includes("/")) {
          // B. Relative path with slashes: Resolve relative to current dir
          try {
            const resolved = new URL(url, baseWikiUrl); // Resolve relative to current dir's base URL
            newUrl = resolved.pathname; // Use the absolute path from the resolved URL
          } catch (e) {
            console.warn(
              `      ⚠️ Could not resolve relative URL "${originalUrlForWarning}" in file ${filePath} relative to base ${baseWikiUrl}. Error: ${
                e instanceof Error ? e.message : e
              }. Keeping ${
                isEnStripped ? "stripped" : "original"
              } URL: "${url}".`
            );
            newUrl = url; // Keep the original (or /en/ stripped) relative path if resolution fails
          }
        } else {
          // C. Simple relative path (no slashes): Leave as is
          return match; // Return the original match without modification
        }

        // --- Common Normalization (for cases A and B) ---
        if (newUrl.toLowerCase().endsWith(".md")) {
          newUrl = newUrl.slice(0, -".md".length);
        }
        if (newUrl.toLowerCase().endsWith("/index")) {
          newUrl = newUrl.slice(0, -"/index".length) || "/";
        }
        if (newUrl !== "/" && newUrl.endsWith("/")) {
          newUrl = newUrl.slice(0, -1);
        }
        // Ensure starts with / (should be true for A and B after resolution/assignment)
        if (!newUrl.startsWith("/")) {
          newUrl = "/" + newUrl;
        }

        return `[${text}](${newUrl}${originalHash})`; // Reconstruct link
      }
    );
    // -----------------------------------

    // Parse the MODIFIED content with gray-matter
    const { data, content } = matter(modifiedFileContent);
    const tags: string[] = data.tags || []; // Extract tags from frontmatter

    // --- Determine Database Path --- (
    let dbPath = "/"; // Default path
    if (data.path) {
      // Use frontmatter path if provided
      dbPath = data.path.startsWith("/") ? data.path : `/${data.path}`;
    } else {
      // Derive path from file structure
      const relativePath = path.relative(baseDir, filePath);
      // Normalize separators and remove extension
      dbPath = "/" + relativePath.replace(/\\/g, "/").replace(/\.md$/, "");
      // Handle index files (e.g., /some/path/index -> /some/path)
      if (dbPath.endsWith("/index")) {
        dbPath = dbPath.substring(0, dbPath.length - "/index".length) || "/";
      }
      // Handle home.md at root specifically -> /
      if (dbPath === "/home") {
        dbPath = "/";
      }
    }
    // --- Determine Title --- (
    const title = data.title || path.basename(filePath, ".md"); // Use frontmatter title or filename

    // --- Determine Dates --- (
    const createdAt =
      data.createdAt && !isNaN(new Date(data.createdAt).getTime())
        ? new Date(data.createdAt)
        : new Date();
    const updatedAt =
      data.updatedAt && !isNaN(new Date(data.updatedAt).getTime())
        ? new Date(data.updatedAt)
        : createdAt; // Default updated to created if not specified

    // --- Check if page exists --- (
    const existingPage = await db.query.wikiPages.findFirst({
      where: eq(schema.wikiPages.path, dbPath), // Use schema.wikiPages
    });

    if (existingPage) {
      console.log(
        `      ℹ️ Page with path "${dbPath}" already exists (from file: ${path.basename(
          filePath
        )}). Skipping.`
      );
    } else {
      // --- Create the page --- (
      const insertedPage = await db // Use schema.wikiPages
        .insert(schema.wikiPages)
        .values({
          path: dbPath.replace(/^\//, ""), // Replace leading / before storing
          title: title,
          content: content, // Use the MODIFIED content here
          createdById: userId,
          updatedById: userId,
          isPublished: true, // Assume published for seeded pages
          createdAt: createdAt,
          updatedAt: updatedAt,
          editorType: "markdown", // Assume markdown for seeded pages
        })
        .returning(); // Changed returning to have no arguments

      if (!insertedPage || insertedPage.length === 0) {
        console.error(`      ❌ Failed to get ID for inserted page: ${dbPath}`);
        return; // Skip tag processing if page insertion failed
      }
      // Add explicit check for the first element before accessing id
      if (!insertedPage[0]) {
        console.error(
          `      ❌ Inserted page array exists but element 0 is missing for: ${dbPath}`
        );
        return;
      }
      const pageId = insertedPage[0].id;

      console.log(
        `      ✅ Created page: "${title}" at path "${dbPath}" (from file: ${path.basename(
          filePath
        )}) (ID: ${pageId})`
      );

      // --- Process and link tags ---
      if (tags.length > 0) {
        console.log(
          `        🏷️ Processing tags for page "${dbPath}": ${tags.join(", ")}`
        );
        for (const tagName of tags) {
          if (!tagName || typeof tagName !== "string") {
            console.warn(
              `        ⚠️ Invalid tag found for page "${dbPath}":`,
              tagName
            );
            continue;
          }
          const trimmedTagName = tagName.trim();
          if (!trimmedTagName) {
            console.warn(
              `        ⚠️ Empty tag found after trimming for page "${dbPath}". Skipping.`
            );
            continue;
          }

          try {
            // Find or create the tag
            const tagRecord = await db.query.wikiTags.findFirst({
              where: eq(schema.wikiTags.name, trimmedTagName),
            });

            let tagId: number;
            if (tagRecord) {
              tagId = tagRecord.id;
              console.log(
                `          -> Found existing tag "${trimmedTagName}" (ID: ${tagId})`
              );
            } else {
              const newTag = await db
                .insert(schema.wikiTags)
                .values({
                  name: trimmedTagName,
                })
                .returning(); // Changed returning to have no arguments

              if (!newTag || newTag.length === 0) {
                console.error(
                  `          ❌ Failed to insert tag: ${trimmedTagName}`
                );
                continue; // Skip linking this tag
              }
              // Add explicit check for the first element before accessing id
              if (!newTag[0]) {
                console.error(
                  `          ❌ Inserted tag array exists but element 0 is missing for: ${trimmedTagName}`
                );
                continue;
              }
              tagId = newTag[0].id;
              console.log(
                `          -> Created new tag "${trimmedTagName}" (ID: ${tagId})`
              );
            }

            // Link tag to page
            await db
              .insert(schema.wikiPageToTag)
              .values({
                pageId: pageId,
                tagId: tagId,
              })
              .onConflictDoNothing(); // Avoid errors if link already exists
            console.log(
              `          🔗 Linked tag "${trimmedTagName}" to page "${dbPath}"`
            );
          } catch (tagError) {
            console.error(
              `        ❌ Error processing tag "${trimmedTagName}" for page "${dbPath}":`,
              tagError
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(`      ❌ Error processing file "${filePath}":`, error);
  }
}

/**
 * Recursively traverses a directory and processes all .md files found.
 */
async function traverseDirectory(dir: string, baseDir: string, userId: number) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await traverseDirectory(fullPath, baseDir, userId); // Recurse into subdirectory
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        await processMarkdownFile(fullPath, baseDir, userId); // Process markdown file
      }
    }
  } catch (error) {
    // Handle cases where the directory might not exist
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.warn(`      ⚠️ Directory not found: ${dir}. Skipping.`);
    } else {
      console.error(`      ❌ Error reading directory "${dir}":`, error);
    }
  }
}

/**
 * Seeds wiki pages by scanning the ./pages directory.
 */
export async function seedExamplePages() {
  console.log("    ↳ Seeding wiki pages from ./custom/pages directory...");

  // Find the admin user to assign authorship
  const adminUser = await db.query.users.findFirst({
    where: eq(schema.users.email, "admin@example.com"), // Use schema.users
  });

  if (!adminUser) {
    console.warn(
      "      ⚠️ Admin user (admin@example.com) not found. Cannot seed pages. Please ensure admin user is seeded first."
    );
    return;
  }

  // Start traversal
  await traverseDirectory(PAGES_ROOT_DIR, PAGES_ROOT_DIR, adminUser.id);

  console.log("    ↳ Finished seeding wiki pages from directory.");
}
