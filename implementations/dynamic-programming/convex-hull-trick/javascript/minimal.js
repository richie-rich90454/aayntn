"use strict";

/**
 * Educational reference implementation: JavaScript is not a USACO submission
 * language.
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
     * switch points of the neighbors have to decrease along the stack, and
     * the comparison is done on the switch points, so the products of the
     * coefficients never enter the arithmetic.
     */
    static redundant(m1, b1, m2, b2, m3, b3) {
        return (b1 - b2) / (m2 - m1) <= (b2 - b3) / (m3 - m2);
    }
}

// Self-check only: the class above is the reusable part, so this file asserts
// the documented contract instead of reading input.
const hull = new ConvexHull();
hull.add(1, 0);
hull.add(2, -1);
// The line 2x - 1 is never the smallest, so it is pruned.
hull.add(3, -3);
if (hull.query(0) !== -3) {
    throw new Error("hull contract broken");
}
if (hull.query(1) !== 0) {
    throw new Error("hull contract broken");
}
if (hull.query(2) !== 2) {
    throw new Error("hull contract broken");
}

// A new line with a larger slope can win for the current x.
hull.add(4, -20);
if (hull.query(3) !== -8) {
    throw new Error("hull contract broken");
}

// A line with the same slope wins only with a smaller intercept.
hull.add(4, -30);
if (hull.query(3) !== -18) {
    throw new Error("hull contract broken");
}
hull.add(4, 0);
if (hull.query(3) !== -18) {
    throw new Error("hull contract broken");
}
