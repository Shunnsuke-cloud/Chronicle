import { AppError } from "@/lib/errors";

export class QueryAuthorizationError extends AppError {
  constructor(message = "You are not allowed to read this project.") {
    super(message, "QUERY_AUTHORIZATION_ERROR");
    this.name = "QueryAuthorizationError";
  }
}

export class QueryNotFoundError extends AppError {
  constructor(message: string) {
    super(message, "QUERY_NOT_FOUND_ERROR");
    this.name = "QueryNotFoundError";
  }
}
