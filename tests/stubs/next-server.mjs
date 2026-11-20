export function after(fn) {
  return fn();
}
export class NextResponse {
  static json(body, init) {
    return { body, init };
  }
}
