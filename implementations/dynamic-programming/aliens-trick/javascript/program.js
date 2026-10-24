/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 *
 * The aliens trick for splitting an array into exactly k contiguous groups.
 * Input: n k, then n nonnegative integers. Output: the minimum possible sum of
 * squared group sums.
 *
 * A group spanning prefix positions j + 1 .. i costs
 * (prefix[i] - prefix[j]) ** 2. Charging a penalty for every group removes the
 * group count from the state, and a binary search over the penalty recovers the
 * answer for exactly k groups.
 *
 * Every value used by the dynamic program is below 2 ** 53, so Number is exact.
 * The final subtraction can exceed 2 ** 53, so it is done with BigInt.
 */

"use strict";

/**
 * @param {number} m1 slope of the first line
 * @param {number} b1 intercept of the first line
 * @param {number} c1 group count of the first line
 * @param {number} m2 slope of the second line
 * @param {number} b2 intercept of the second line
 * @param {number} c2 group count of the second line
 * @param {number} x query point
 * @returns {boolean} whether the first line is better at x
 */
function better(m1, b1, c1, m2, b2, c2, x) {
    const left = m1 * x + b1;
    const right = m2 * x + b2;
    if (left !== right) {
        return left < right;
    }
    return c1 > c2;
}

/**
 * @param {number[]} prefix prefix sums
 * @param {number} n number of elements
 * @param {number} penalty the charge for one group
 * @returns {{value: number, groups: number}} the penalized optimum
 */
function penalized(prefix, n, penalty) {
    const size = 4 * (n + 1) + 8;
    const present = new Uint8Array(size);
    const slope = new Float64Array(size);
    const intercept = new Float64Array(size);
    const groups = new Int32Array(size);

    function insert(node, left, right, m, b, c) {
        if (present[node] === 0) {
            present[node] = 1;
            slope[node] = m;
            intercept[node] = b;
            groups[node] = c;
            return;
        }
        const mid = Math.floor((left + right) / 2);
        if (better(m, b, c, slope[node], intercept[node], groups[node], prefix[mid])) {
            const previousM = slope[node];
            const previousB = intercept[node];
            const previousC = groups[node];
            slope[node] = m;
            intercept[node] = b;
            groups[node] = c;
            m = previousM;
            b = previousB;
            c = previousC;
        }
        if (left === right) {
            return;
        }
        if (better(m, b, c, slope[node], intercept[node], groups[node], prefix[left])) {
            insert(2 * node, left, mid, m, b, c);
        } else if (better(m, b, c, slope[node], intercept[node], groups[node], prefix[right])) {
            insert(2 * node + 1, mid + 1, right, m, b, c);
        }
    }

    function query(index) {
        let node = 1;
        let left = 0;
        let right = n;
        const x = prefix[index];
        let bestValue = 0;
        let bestGroups = 0;
        let found = false;
        while (true) {
            if (present[node] === 1) {
                const value = slope[node] * x + intercept[node];
                if (
                    !found ||
                    value < bestValue ||
                    (value === bestValue && groups[node] > bestGroups)
                ) {
                    bestValue = value;
                    bestGroups = groups[node];
                    found = true;
                }
            }
            if (left === right) {
                break;
            }
            const mid = Math.floor((left + right) / 2);
            if (index <= mid) {
                node *= 2;
                right = mid;
            } else {
                node = 2 * node + 1;
                left = mid + 1;
            }
        }
        return { value: bestValue, groups: bestGroups };
    }

    insert(1, 0, n, 0, 0, 0);
    let value = 0;
    let count = 0;
    for (let i = 1; i <= n; i += 1) {
        const x = prefix[i];
        const line = query(i);
        value = line.value + x * x + penalty;
        count = line.groups + 1;
        insert(1, 0, n, -2 * x, value + x * x, count);
    }
    return { value, groups: count };
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }
    const n = Number(tokens[0]);
    let k = Number(tokens[1]);
    if (n <= 0) {
        process.stdout.write("0\n");
        return;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    const prefix = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i += 1) {
        const value = i + 1 < tokens.length ? Number(tokens[i + 1]) : 0;
        prefix[i] = prefix[i - 1] + value;
    }

    const total = prefix[n];
    let low = 0;
    let high = total * total + 1;
    while (low < high) {
        const mid = low + Math.floor((high - low + 1) / 2);
        const result = penalized(prefix, n, mid);
        if (result.groups >= k) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    const result = penalized(prefix, n, low);
    const answer = BigInt(result.value) - BigInt(low) * BigInt(k);
    process.stdout.write(answer.toString() + "\n");
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
    input += chunk;
});
process.stdin.on("end", () => {
    main(input);
});
