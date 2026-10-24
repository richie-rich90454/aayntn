// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/**
 * Reads n intervals, runs the earliest-finish greedy and the exhaustive
 * optimum, and prints both counts with MATCH or DIFFER.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isInteger(n) || n < 0 || n > 12 || tokens.length < 1 + 2 * n) {
        return;
    }

    const intervals = [];
    for (let i = 0; i < n; i += 1) {
        intervals.push({
            start: Number(tokens[1 + 2 * i]),
            end: Number(tokens[2 + 2 * i]),
        });
    }

    const sorted = intervals
        .slice()
        .sort((a, b) => (a.end !== b.end ? a.end - b.end : a.start - b.start));

    let greedy = 0;
    let freeTime = Number.NEGATIVE_INFINITY;
    for (const interval of sorted) {
        if (interval.start >= freeTime) {
            greedy += 1;
            freeTime = interval.end;
        }
    }

    /**
     * @param {{start: number, end: number}} a
     * @param {{start: number, end: number}} b
     * @returns {boolean}
     */
    const compatible = (a, b) => a.end <= b.start || b.end <= a.start;

    let best = 0;
    for (let mask = 0; mask < 1 << n; mask += 1) {
        let count = 0;
        let ok = true;
        for (let left = 0; left < n && ok; left += 1) {
            if ((mask & (1 << left)) === 0) {
                continue;
            }
            count += 1;
            for (let right = left + 1; right < n; right += 1) {
                if ((mask & (1 << right)) !== 0 && !compatible(intervals[left], intervals[right])) {
                    ok = false;
                    break;
                }
            }
        }
        if (ok && count > best) {
            best = count;
        }
    }

    process.stdout.write(`${greedy} ${best}\n`);
    process.stdout.write(greedy === best ? "MATCH\n" : "DIFFER\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
