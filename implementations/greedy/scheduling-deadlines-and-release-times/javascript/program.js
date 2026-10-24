// Educational reference implementation: JavaScript is not a USACO submission language.
"use strict";

/** A binary min-heap of profits, backed by a plain array. */
class MinHeap {
    constructor() {
        this.values = [];
    }

    get size() {
        return this.values.length;
    }

    push(value) {
        const values = this.values;
        values.push(value);
        let index = values.length - 1;

        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (values[parent] <= values[index]) {
                break;
            }
            [values[parent], values[index]] = [values[index], values[parent]];
            index = parent;
        }
    }

    pop() {
        const values = this.values;
        const smallest = values[0];
        const last = values.pop();

        if (values.length === 0) {
            return smallest;
        }

        values[0] = last;
        let index = 0;
        for (;;) {
            const left = 2 * index + 1;
            const right = left + 1;
            let next = index;

            if (left < values.length && values[left] < values[next]) {
                next = left;
            }
            if (right < values.length && values[right] < values[next]) {
                next = right;
            }
            if (next === index) {
                break;
            }

            [values[index], values[next]] = [values[next], values[index]];
            index = next;
        }

        return smallest;
    }
}

/**
 * Reads unit-time jobs with deadlines and profits, sorts them by deadline, and
 * keeps the most profitable set that fits the deadline prefix.
 *
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length === 0) {
        return;
    }

    const n = Number(tokens[0]);
    if (!Number.isFinite(n) || n <= 0) {
        process.stdout.write("0\n");
        return;
    }
    if (tokens.length < 1 + 2 * n) {
        process.stdout.write("0\n");
        return;
    }

    const jobs = [];
    let index = 1;
    for (let i = 0; i < n; i += 1) {
        jobs.push({
            deadline: Number(tokens[index]),
            profit: Number(tokens[index + 1]),
        });
        index += 2;
    }

    jobs.sort((x, y) => x.deadline - y.deadline);

    const kept = new MinHeap();
    for (const job of jobs) {
        kept.push(job.profit);
        if (kept.size > job.deadline) {
            kept.pop();
        }
    }

    let total = 0;
    for (const profit of kept.values) {
        total += profit;
    }
    process.stdout.write(`${total}\n`);
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
