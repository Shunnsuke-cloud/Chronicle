import { AppError } from "@/lib/errors";

export class CommandValidationError extends AppError {
  constructor(message: string) {
    super(message, "COMMAND_VALIDATION_ERROR");
    this.name = "CommandValidationError";
  }
}

export class CommandAuthorizationError extends AppError {
  constructor(message = "You are not allowed to modify this project.") {
    super(message, "COMMAND_AUTHORIZATION_ERROR");
    this.name = "CommandAuthorizationError";
  }
}

export class CommandNotFoundError extends AppError {
  constructor(message: string) {
    super(message, "COMMAND_NOT_FOUND_ERROR");
    this.name = "CommandNotFoundError";
  }
}
