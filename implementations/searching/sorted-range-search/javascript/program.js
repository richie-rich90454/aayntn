// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * Sorted range search driver.
 *
 * Reads n, then n disjoint intervals sorted by left endpoint, then one point.
 * Prints the 0-based index of the interval that contains the point, or -1 when
 * no interval contains it.
 */

function locate(intervals, point) {
    let lo = 0;
    let hi = intervals.length - 1;

    while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        const [left, right] = intervals[mid];
        if (point < left) {
            hi = mid - 1;
        } else if (point > right) {
            lo = mid + 1;
        } else {
            return mid;
        }
    }
    return -1;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);

    if (tokens.length === 0) {
        process.stdout.write("-1\n");
        return;
    }

    const n = Number(tokens[0]);

    if (!Number.isInteger(n) || n < 0 || tokens.length < 2 * n + 2) {
        process.stdout.write("-1\n");
        return;
    }

    const intervals = [];
    for (let i = 0; i < n; ++i) {
        intervals.push([Number(tokens[2 * i + 1]), Number(tokens[2 * i + 2])]);
    }

    const point = Number(tokens[2 * n + 1]);
    process.stdout.write(String(locate(intervals, point)) + "\n");
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
