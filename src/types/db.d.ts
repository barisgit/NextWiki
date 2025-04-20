import { PgTransaction } from "drizzle-orm/pg-core";

export type Transaction = PgTransaction<TQueryResult, TFullSchema, TSchema>;
