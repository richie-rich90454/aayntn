"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

// The other five languages write through a text stream, which turns a newline
// into the platform separator; matching it keeps the six outputs identical.
const EOL = process.platform === "win32" ? "\r\n" : "\n";

/**
 * Aho-Corasick over the lowercase Latin alphabet.
 *
 * Input: n, then n patterns on separate lines, then the text on the last line.
 * Output: one line per pattern, holding the number of its occurrences in the
 * text, overlapping occurrences included.
 *
 * The trie stores 26 transitions per node, all initialized to -1. The failure
 * links are built in breadth-first order, and a missing transition is filled
 * with the transition of the failure link, so the scan performs one lookup per
 * text character. The counters are then pushed up the failure tree in reverse
 * breadth-first order, which counts the occurrences without enumerating them.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    let pointer = 0;
    let n = Number(tokens[pointer]);
    pointer += 1;
    if (!Number.isFinite(n) || n < 0) {
        n = 0;
    }

    const patterns = [];
    let total = 0;
    for (let i = 0; i < n; i += 1) {
        const pattern = pointer < tokens.length ? tokens[pointer] : "";
        pointer += 1;
        patterns.push(pattern);
        total += pattern.length;
    }
    const text = pointer < tokens.length ? tokens[pointer] : "";

    const go = Array.from({ length: total + 1 }, () => new Int32Array(26).fill(-1));
    const fail = new Int32Array(total + 1);
    const count = new Array(total + 1).fill(0n);
    const terminal = new Int32Array(n);
    const order = new Int32Array(total + 1);

    // Insert every pattern, remembering the terminal node of each one.
    let nodes = 1;
    for (let i = 0; i < n; i += 1) {
        let v = 0;
        const pattern = patterns[i];
        for (let j = 0; j < pattern.length; j += 1) {
            const c = pattern.charCodeAt(j) - 97;
            if (c < 0 || c >= 26) {
                continue;
            }
            if (go[v][c] === -1) {
                go[v][c] = nodes;
                nodes += 1;
            }
            v = go[v][c];
        }
        terminal[i] = v;
    }

    // Build the failure links and complete the transition table.
    let head = 0;
    let tail = 0;
    for (let c = 0; c < 26; c += 1) {
        const u = go[0][c];
        if (u === -1) {
            go[0][c] = 0;
        } else {
            fail[u] = 0;
            order[tail] = u;
            tail += 1;
        }
    }
    while (head < tail) {
        const v = order[head];
        head += 1;
        const fv = fail[v];
        const row = go[v];
        const failRow = go[fv];
        for (let c = 0; c < 26; c += 1) {
            const u = row[c];
            if (u === -1) {
                row[c] = failRow[c];
            } else {
                fail[u] = failRow[c];
                order[tail] = u;
                tail += 1;
            }
        }
    }

    let state = 0;
    for (let i = 0; i < text.length; i += 1) {
        const c = text.charCodeAt(i) - 97;
        if (c < 0 || c >= 26) {
            continue;
        }
        state = go[state][c];
        count[state] += 1n;
    }

    for (let i = tail - 1; i >= 0; i -= 1) {
        const v = order[i];
        count[fail[v]] += count[v];
    }

    const lines = [];
    for (let i = 0; i < n; i += 1) {
        lines.push(count[terminal[i]].toString());
    }
    if (lines.length > 0) {
        process.stdout.write(lines.join(EOL) + EOL);
    }
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
