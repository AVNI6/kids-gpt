// Global server-side map to track active AI generation abort controllers
// Uses globalThis to ensure it is shared across separate Next.js route bundles and survives HMR
const globalActiveGenerations =
  (globalThis as typeof globalThis & { activeGenerations?: Map<string, AbortController> })
    .activeGenerations || new Map<string, AbortController>();

if (
  !(globalThis as typeof globalThis & { activeGenerations?: Map<string, AbortController> })
    .activeGenerations
) {
  (
    globalThis as typeof globalThis & { activeGenerations?: Map<string, AbortController> }
  ).activeGenerations = globalActiveGenerations;
}

export const activeGenerations = globalActiveGenerations;
