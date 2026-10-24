// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs byte-identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * Minimum cost path with hops of at most k positions.
 *
 * Input: n k, then n integers a[1..n].
 * Output: dp[n], on one line.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        process.stdout.write("0" + EOL);
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const k = Math.max(1, Number(tokens[1]));

    // BigInt keeps the sum exact even when n * |a[i]| passes 2^53.
    const dp = new Array(n + 1);
    // The deque holds indices with strictly increasing dp values, so the front
    // is the cheapest candidate inside the current window.
    const deque = new Array(n + 1);
    dp[0] = 0n;
    let head = 0;
    let tail = 0;
    deque[tail] = 0;
    tail += 1;
    let kept = 0;

    let index = 2;
    for (let i = 1; i <= n; i += 1) {
        if (index >= tokens.length) {
            break;
        }
        const value = BigInt(tokens[index]);
        index += 1;

        // The window is [i - k, i - 1], so an index is stale only when it is
        // strictly smaller than i - k.
        while (head < tail && deque[head] < i - k) {
            head += 1;
        }

        dp[i] = value + dp[deque[head]];

        // An older index with a value no smaller than dp[i] can never be the
        // minimum again: i expires later and is at least as cheap.
        while (head < tail && dp[deque[tail - 1]] >= dp[i]) {
            tail -= 1;
        }
        deque[tail] = i;
        tail += 1;
        kept = i;
    }

    process.stdout.write(dp[kept].toString() + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
