import { Controller, Get } from "@nestjs/common";

/**
 * Controller for health checks
 * Used by deployment platforms to ensure the service is running properly
 */
@Controller("health")
export class HealthController {
  /**
   * Basic health check endpoint
   * @returns A simple message indicating the service is running
   */
  @Get()
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }
}
