import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validationSchema } from "./validation.schema.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: [".env.development.local", ".env.development", ".env"], // Load env files in order of precedence
      validationSchema: validationSchema, // Apply validation schema
      validationOptions: {
        allowUnknown: true, // Allow env vars not in the schema
        abortEarly: false, // Report all validation errors
      },
    }),
  ],
  exports: [ConfigModule], // Export ConfigModule if you need ConfigService directly elsewhere, otherwise create an AppConfigService wrapper
})
export class AppConfigModule {}
