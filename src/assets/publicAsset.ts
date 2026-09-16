/** Resolve public files under the same base path as the deployed game. */
export function publicAsset(path: string) {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}
