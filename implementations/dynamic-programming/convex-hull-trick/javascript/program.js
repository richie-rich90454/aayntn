"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
 */

/**
 * The smallest value of a set of lines, read from standard input.
 *
 * Input: n q, then n lines m b that add the line y = m * x + b, then q lines
 * x that query the smallest value of the lines added so far.
 * Output: one line per query, holding the smallest value.
 */

/**
 * A monotone convex hull trick over the lines y = m * x + b: the lines are
 * added with a non-decreasing slope, the queries arrive with a non-decreasing
 * x, and the answer is the smallest value of the lines added so far.
 *
 * The hull is a stack of lines with increasing slopes. The line on top of the
 * stack is the one that is smallest for the smallest x, and a query walks
 * down the stack as the x grows.
 *
 * The instance owns its arrays, so the hull is reclaimed with the object.
 */
class ConvexHull {
    constructor() {
        this.slope = [];
        this.intercept = [];
    }

    /**
     * Adds the line y = m * x + b. The slope must not be smaller than the
     * slope of the line added before, which is what makes the amortised cost
     * of the operations constant.
     *
     * @param {number} m the slope of the line
     * @param {number} b the intercept of the line
     */
    add(m, b) {
        while (this.slope.length > 0 && this.slope[this.slope.length - 1] === m) {
            if (this.intercept[this.intercept.length - 1] <= b) {
                // The new line is never the smallest, so it is dropped.
                return;
            }
            // The new line wins against the line with the same slope.
            this.slope.pop();
            this.intercept.pop();
        }
        while (
            this.slope.length >= 2 &&
            ConvexHull.redundant(
                this.slope[this.slope.length - 2],
                this.intercept[this.intercept.length - 2],
                this.slope[this.slope.length - 1],
                this.intercept[this.intercept.length - 1],
                m,
                b,
            )
        ) {
            // The line on top of the stack is never the smallest.
            this.slope.pop();
            this.intercept.pop();
        }
        this.slope.push(m);
        this.intercept.push(b);
    }

    /**
     * The smallest value of the lines added so far at the point x. The x
     * values must not decrease, which is what lets the query drop the lines it
     * walks past. The answer of a query with no line at all is 0.
     *
     * @param {number} x the point of the query
     * @returns {number} the smallest value
     */
    query(x) {
        if (this.slope.length === 0) {
            return 0;
        }
        while (this.slope.length >= 2) {
            const top =
                this.slope[this.slope.length - 1] * x + this.intercept[this.intercept.length - 1];
            const below =
                this.slope[this.slope.length - 2] * x + this.intercept[this.intercept.length - 2];
            if (below >= top) {
                break;
            }
            /*
             * The line on top of the stack has the larger slope, so it stays
             * the worse of the two for every larger x and is dropped for good.
             */
            this.slope.pop();
            this.intercept.pop();
        }
        return this.slope[this.slope.length - 1] * x + this.intercept[this.intercept.length - 1];
    }

    /**
     * True when the middle line of the three never holds the minimum: the
     * switch points of the neighbours have to decrease along the stack, and
     * the comparison is done on the switch points, so the products of the
     * coefficients never enter the arithmetic.
     */
    static redundant(m1, b1, m2, b2, m3, b3) {
        return (b1 - b2) / (m2 - m1) <= (b2 - b3) / (m3 - m2);
    }
}

/**
 * @param {string} input the whole standard input
 */
function main(input) {
    const tokens = input.split(/\s+/).filter((token) => token.length > 0);
    if (tokens.length < 2) {
        return;
    }

    const n = Math.max(0, Number(tokens[0]));
    const q = Math.max(0, Number(tokens[1]));

    const hull = new ConvexHull();
    let index = 2;
    for (let i = 0; i < n; i += 1) {
        if (index + 1 >= tokens.length) {
            break;
        }
        const m = Number(tokens[index]);
        const b = Number(tokens[index + 1]);
        index += 2;
        hull.add(m, b);
    }

    const lines = [];
    for (let k = 0; k < q; k += 1) {
        if (index >= tokens.length) {
            break;
        }
        const x = Number(tokens[index]);
        index += 1;
        lines.push(String(hull.query(x)));
    }

    if (lines.length > 0) {
        process.stdout.write(lines.join("\n") + "\n");
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
