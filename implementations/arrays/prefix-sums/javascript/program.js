"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * Prefix sums driver.
 *
 * Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints one range sum per line.
 */

// The C, C++, Java and Python listings write the platform line ending, so
// JavaScript writes the same one and every language emits identical bytes.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * Prefix sums over an array of values.
 *
 * Contract: the returned array holds a.length + 1 entries with prefix[0] = 0n
 * and prefix[i] = prefix[i-1] + a[i-1] for every 1 <= i <= n, so the sum of
 * a[l-1 .. r-1] is prefix[r] - prefix[l-1].
 *
 * The sums are BigInt because the documented range reaches 10^15 and the
 * prefix sums must stay exact; a double would lose the low bits.
 */
function prefixSums(a) {
    const prefix = new Array(a.length + 1);
    prefix[0] = 0n;
    for (let i = 0; i < a.length; i += 1) {
        prefix[i + 1] = prefix[i] + a[i];
    }
    return prefix;
}

/**
 * Parses a decimal integer token exactly.
 *
 * @param {string} token one whitespace-separated token
 * @returns {bigint} the value of the token, or 0n when it is not an integer
 */
function toInteger(token) {
    const text = token.trim();
    if (!/^[+-]?\d+$/.test(text)) {
        return 0n;
    }
    return BigInt(text.startsWith("+") ? text.slice(1) : text);
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let n = Number(tokens[0]);
    if (!Number.isFinite(n) || n < 0) {
        n = 0;
    }
    n = Math.floor(n);

    // The values start at zero, so a truncated input leaves zeros behind.
    const a = new Array(n);
    for (let i = 0; i < n; i += 1) {
        a[i] = i + 1 < tokens.length ? toInteger(tokens[i + 1]) : 0n;
    }

    const prefix = prefixSums(a);

    let q = 0;
    if (n + 1 < tokens.length) {
        q = Number(tokens[n + 1]);
        if (!Number.isFinite(q) || q < 0) {
            q = 0;
        }
        q = Math.floor(q);
    }

    const lines = [];
    let index = n + 2;
    for (let j = 0; j < q; j += 1) {
        if (index + 1 >= tokens.length) {
            break;
        }
        let l = Number(tokens[index]);
        let r = Number(tokens[index + 1]);
        index += 2;
        // A range that leaves the array is clipped, so the lookup stays in
        // bounds; a range that is empty after clipping sums to zero.
        if (l < 1) {
            l = 1;
        }
        if (r > n) {
            r = n;
        }
        if (l > r) {
            lines.push("0");
        } else {
            lines.push(String(prefix[r] - prefix[l - 1]));
        }
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join(EOL) + EOL);
    }
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
