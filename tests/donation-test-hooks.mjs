const stubs = new Map([
  ["server-only", new URL("./stubs/empty.mjs", import.meta.url).href],
]);

export async function resolve(specifier, context, nextResolve) {
  const stub = stubs.get(specifier);
  if (stub) return { url: stub, shortCircuit: true };
  return nextResolve(specifier, context);
}
