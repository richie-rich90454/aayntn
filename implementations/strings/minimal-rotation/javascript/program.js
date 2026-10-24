// Educational reference implementation: JavaScript is not a USACO submission language.
//
// The minimal rotation of a string.
//
// Input: one nonempty string without spaces, of length at most 10^6.
// Output: the lexicographically smallest rotation of the string.
//
// Two candidate start positions i and j advance through the string while k
// counts the characters they agree on. When the candidates finally differ, the
// loser and every start inside the matched block are eliminated at once, so
// each character is compared a constant number of times.

"use strict";

function leastRotation(s) {
    const n = s.length;
    let i = 0;
    let j = 1;
    let k = 0;

    while (i < n && j < n && k < n) {
        const a = s[(i + k) % n];
        const b = s[(j + k) % n];
        if (a === b) {
            k += 1;
        } else if (a > b) {
            i = i + k + 1;
            if (i <= j) {
                i = j + 1;
            }
            k = 0;
        } else {
            j = j + k + 1;
            if (j <= i) {
                j = i + 1;
            }
            k = 0;
        }
    }
    return i < j ? i : j;
}

function main(input) {
    const s = input.trim();
    const n = s.length;
    if (n === 0) {
        process.stdout.write("\n");
        return;
    }
    const start = leastRotation(s);
    let out = "";
    for (let t = 0; t < n; t += 1) {
        out += s[(start + t) % n];
    }
    process.stdout.write(out + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
