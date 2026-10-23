/**
 * The publication base.
 *
 * A site served under a path reports its routes with the path in front. The
 * navigation compares those routes against destinations written without it,
 * so the comparison only works after the path has been taken off. These cases
 * are the ones that failed silently on the published site.
 */
import { describe, expect, it } from "vitest";
import { stripBase } from "../../docs/.vitepress/theme/composables/useBasePath";

describe("the publication base", () => {
    it("takes the base off a published route", () => {
        expect(stripBase("/aayntn/algorithms/graphs/dijkstra", "/aayntn/")).toBe(
            "/algorithms/graphs/dijkstra",
        );
    });

    it("leaves a route that does not carry the base", () => {
        expect(stripBase("/algorithms/graphs/dijkstra", "/aayntn/")).toBe(
            "/algorithms/graphs/dijkstra",
        );
    });

    it("normalises the root and a trailing slash", () => {
        expect(stripBase("/aayntn/", "/aayntn/")).toBe("/");
        expect(stripBase("/", "/")).toBe("/");
        expect(stripBase("/aayntn/algorithms/graphs/", "/aayntn/")).toBe("/algorithms/graphs");
    });

    it("drops a query and a fragment", () => {
        expect(stripBase("/aayntn/about?from=nav#top", "/aayntn/")).toBe("/about");
    });
});
