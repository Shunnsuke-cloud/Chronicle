import { AppError } from "@/lib/errors";

export class EventStoreConcurrencyError extends AppError {
  constructor(
    public readonly projectId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Project ${projectId} expected version ${expectedVersion}, but current version is ${actualVersion}.`,
      "EVENT_STORE_CONCURRENCY_ERROR",
    );
    this.name = "EventStoreConcurrencyError";
  }
}

export class EventStoreMappingError extends AppError {
  constructor(message: string) {
    super(message, "EVENT_STORE_MAPPING_ERROR");
    this.name = "EventStoreMappingError";
  }
}
