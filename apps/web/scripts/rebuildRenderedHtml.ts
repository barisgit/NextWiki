import { markdownService } from "~/lib/services/markdown";
import { logger } from "@repo/logger";

async function main() {
  await markdownService.rebuildAllRenderedHtml();
}

// Run the main function
main().catch((error) => {
  void error;
  // Error details should have been printed already by internal functions
  logger.error("❌ Setup script failed.");
  process.exit(1);
});
