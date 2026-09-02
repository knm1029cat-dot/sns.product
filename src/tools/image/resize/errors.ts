export class ImageResizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageResizeError";
  }
}
