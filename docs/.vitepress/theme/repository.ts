/**
 * The repository that holds the sources of the site.
 *
 * The address is written once, so that the link to the sources, the link
 * that offers an improvement to a page, and the links to the community files
 * can never drift apart.
 */
export const REPOSITORY_URL = "https://github.com/richie-rich90454/aayntn";

/** The address of a file in the repository. */
export function repositoryFile(path: string): string {
    return `${REPOSITORY_URL}/blob/main/${path}`;
}
