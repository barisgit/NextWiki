# Config

This module is used to load the configuration for the backend.
It uses the `@nestjs/config` package to load the configuration from the `.env` file.
It also uses the `joi` package to validate the configuration.

## Usage

```typescript
import { ConfigService } from "@nestjs/config";

const configService = new ConfigService();

const port = configService.get<number>("PORT");
```

## Validation

- The configuration is validated using the `joi` package.
- The validation schema is defined in the `validation.schema.ts` file.
- The validation is done in the `app-config.module.ts` file.

**If any required environment variables are not provided, the application will not start!**
