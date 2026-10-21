"use strict";

/**
 * Binary search driver.
 *
 * Reads n, a sorted run of integers and a target from standard input, then
 * prints the 0-based index of the target, or -1 when it is absent.
 */

// The C, C++, Java and Python listings write the platform line ending, so
// JavaScript writes the same one and every language emits identical bytes.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

function binarySearch(a, target) {
    let lo = 0;
    let hi = a.length - 1;
    while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        if (a[mid] === target) {
            return mid;
        }
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return -1;
}

function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);

    // The target is the final token and the array takes at most n of the tokens
    // before it, so a header that disagrees with the data cannot swallow the
    // target.
    if (tokens.length < 2) {
        process.stdout.write("-1" + EOL);
        return;
    }

    const values = tokens.map(Number);
    const declared = values[0];
    const target = values[values.length - 1];
    const available = values.length - 2;
    let arrayLength = Math.min(declared, available);
    if (arrayLength < 0) {
        arrayLength = 0;
    }

    const answer = binarySearch(values.slice(1, 1 + arrayLength), target);
    process.stdout.write(String(answer) + EOL);
}

process.stdin.setEncoding("utf8");
let input = "";
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
