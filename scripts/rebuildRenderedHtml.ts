import { markdownService } from "~/lib/services/markdown";

async function main() {
  await markdownService.rebuildAllRenderedHtml();
}

// Run the main function
main().catch((error) => {
  void error;
  // Error details should have been printed already by internal functions
  console.error("❌ Setup script failed.");
  process.exit(1);
});
