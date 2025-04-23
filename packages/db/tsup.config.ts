import { defineConfig } from "tsup";
import { exec } from "child_process"; // Import exec for onSuccess command

export default defineConfig({
  entry: ["src/index.ts", "src/client.ts"], // Add client.ts entry point
  format: ["esm", "cjs"], // Output formats
  dts: true, // Generate .d.ts files
  splitting: false, // Keep everything in one file per format
  sourcemap: true, // Generate source maps
  clean: true, // Clean dist folder before build
  outExtension(ctx) {
    // Ensure .cjs extension for commonjs
    return {
      js: ctx.format === "cjs" ? `.cjs` : ".js",
    };
  },
  async onSuccess() {
    // Copy the pages directory after build succeeds
    // Uses shell command, adjust if needed for cross-platform compatibility (e.g., use fs-extra)
    console.log("Build successful, copying pages directory...");
    await new Promise((resolve, reject) => {
      exec(
        "cp -R src/seeds/developer/pages dist/pages",
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Error copying pages: ${error}`);
            return reject(error);
          }
          if (stderr) {
            console.error(`Copy stderr: ${stderr}`);
            // Optional: reject on stderr? Depends if warnings are expected
          }
          console.log(`Copy stdout: ${stdout}`);
          console.log("Successfully copied pages directory.");
          resolve(stdout);
        }
      );
    });
  },
});
