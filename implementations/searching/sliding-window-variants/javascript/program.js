// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/*
 * Longest substring with at most k distinct characters.
 *
 * The window is the longest mode of the state machine: push the next byte,
 * shrink while the distinct count is too large, then record the length.
 */

function longestAtMostK(s, k) {
    if (k < 0) {
        k = 0;
    }

    const count = new Array(256).fill(0);
    let left = 0;
    let distinct = 0;
    let best = 0;

    for (let right = 0; right < s.length; right += 1) {
        const incoming = s.charCodeAt(right);

        if (count[incoming] === 0) {
            distinct += 1;
        }
        count[incoming] += 1;

        while (distinct > k) {
            const outgoing = s.charCodeAt(left);

            count[outgoing] -= 1;
            if (count[outgoing] === 0) {
                distinct -= 1;
            }
            left += 1;
        }

        best = Math.max(best, right - left + 1);
    }

    return best;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);

    if (tokens.length === 0) {
        process.stdout.write("0\n");
        return;
    }

    const s = tokens[0];
    const k = tokens.length > 1 ? Number(tokens[1]) : 0;
    process.stdout.write(String(longestAtMostK(s, Number.isFinite(k) ? k : 0)) + "\n");
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
