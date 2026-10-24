// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * The suffix automaton of a string.
 *
 * Input: one line holding a nonempty string of lowercase Latin letters.
 * Output: the number of distinct nonempty substrings, then the number of
 * occurrences of the lexicographically smallest nonempty substring.
 *
 * The transition table is one Int32Array with 26 entries per state. Prefix
 * states are seeded with one occurrence and clones with zero; the counters are
 * then propagated along the suffix links in decreasing length order. The
 * distinct count is a BigInt because it can exceed the safe 32-bit range.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const lineEnd = input.indexOf("\n");
    let s = lineEnd === -1 ? input : input.slice(0, lineEnd);
    if (s.endsWith("\r")) {
        s = s.slice(0, -1);
    }

    const n = s.length;
    if (n === 0) {
        process.stdout.write("0" + EOL + "0" + EOL);
        return;
    }

    const states = 2 * n + 2;
    const go = new Int32Array(states * 26).fill(-1);
    const maxLen = new Int32Array(states);
    const link = new Int32Array(states);
    const count = new Int32Array(states);
    link[0] = -1;

    let size = 1;
    let last = 0;
    for (let i = 0; i < n; i += 1) {
        const c = s.charCodeAt(i) - 97;
        const cur = size;
        size += 1;
        maxLen[cur] = maxLen[last] + 1;
        count[cur] = 1;

        let p = last;
        while (p !== -1 && go[p * 26 + c] === -1) {
            go[p * 26 + c] = cur;
            p = link[p];
        }

        if (p === -1) {
            link[cur] = 0;
        } else {
            const q = go[p * 26 + c];
            if (maxLen[p] + 1 === maxLen[q]) {
                link[cur] = q;
            } else {
                const clone = size;
                size += 1;
                maxLen[clone] = maxLen[p] + 1;
                go.copyWithin(clone * 26, q * 26, q * 26 + 26);
                link[clone] = link[q];
                count[clone] = 0;

                while (p !== -1 && go[p * 26 + c] === q) {
                    go[p * 26 + c] = clone;
                    p = link[p];
                }
                link[q] = clone;
                link[cur] = clone;
            }
        }
        last = cur;
    }

    const bucket = new Int32Array(n + 1);
    for (let v = 1; v < size; v += 1) {
        bucket[maxLen[v]] += 1;
    }
    for (let i = 1; i <= n; i += 1) {
        bucket[i] += bucket[i - 1];
    }

    const order = new Int32Array(size - 1);
    for (let v = size - 1; v >= 1; v -= 1) {
        bucket[maxLen[v]] -= 1;
        order[bucket[maxLen[v]]] = v;
    }
    for (let i = size - 2; i >= 0; i -= 1) {
        const v = order[i];
        count[link[v]] += count[v];
    }

    let distinct = 0n;
    for (let v = 1; v < size; v += 1) {
        distinct += BigInt(maxLen[v] - maxLen[link[v]]);
    }

    let smallest = 25;
    for (let i = 0; i < n; i += 1) {
        smallest = Math.min(smallest, s.charCodeAt(i) - 97);
    }
    const target = go[smallest];

    process.stdout.write(distinct.toString() + EOL + count[target].toString() + EOL);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
