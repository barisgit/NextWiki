import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";

/**
 * Health check module
 * Provides endpoints for service health monitoring
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
