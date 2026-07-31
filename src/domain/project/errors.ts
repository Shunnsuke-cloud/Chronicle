export class ProjectReducerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectReducerError";
  }
}
