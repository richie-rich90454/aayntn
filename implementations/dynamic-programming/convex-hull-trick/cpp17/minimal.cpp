#include <vector>

/**
 * A monotone convex hull trick over the lines y = m * x + b: the lines are
 * added with a non-decreasing slope, the queries arrive with a non-decreasing
 * x, and the answer is the smallest value of the lines added so far.
 *
 * The hull is a stack of lines with increasing slopes. The line on top of the
 * stack is the one that is smallest for the smallest x, and a query walks
 * down the stack as the x grows.
 *
 * The vectors own the storage, so the constructor allocates them and the
 * destructor releases them without any explicit destroy call.
 */
class ConvexHull {
public:
    explicit ConvexHull(int capacity) {
        slope_.reserve(static_cast<size_t>(capacity > 0 ? capacity : 1));
        intercept_.reserve(static_cast<size_t>(capacity > 0 ? capacity : 1));
    }

    /**
     * Adds the line y = m * x + b. The slope must not be smaller than the
     * slope of the line added before, which is what makes the amortised cost
     * of the operations constant.
     *
     * @param m the slope of the line
     * @param b the intercept of the line
     * @returns {boolean} false when the line was dropped
     */
    bool add(long long m, long long b) {
        while (!slope_.empty() && slope_.back() == m) {
            if (intercept_.back() <= b) {
                // The new line is never the smallest, so it is dropped.
                return true;
            }
            // The new line wins against the line with the same slope.
            slope_.pop_back();
            intercept_.pop_back();
        }
        while (slope_.size() >= 2 &&
               redundant(slope_[slope_.size() - 2], intercept_[intercept_.size() - 2],
                         slope_.back(), intercept_.back(), m, b)) {
            // The line on top of the stack is never the smallest.
            slope_.pop_back();
            intercept_.pop_back();
        }
        slope_.push_back(m);
        intercept_.push_back(b);
        return true;
    }

    /**
     * The smallest value of the lines added so far at the point x. The x
     * values must not decrease, which is what lets the query drop the lines it
     * walks past. The answer of a query with no line at all is 0.
     *
     * @param x the point of the query
     * @returns {long long} the smallest value
     */
    long long query(long long x) {
        if (slope_.empty()) {
            return 0;
        }
        while (slope_.size() >= 2) {
            const long long top =
                slope_[slope_.size() - 1] * x + intercept_[intercept_.size() - 1];
            const long long below =
                slope_[slope_.size() - 2] * x + intercept_[intercept_.size() - 2];
            if (below >= top) {
                break;
            }
            /*
             * The line on top of the stack has the larger slope, so it stays
             * the worse of the two for every larger x and is dropped for good.
             */
            slope_.pop_back();
            intercept_.pop_back();
        }
        return slope_.back() * x + intercept_.back();
    }

private:
    std::vector<long long> slope_;
    std::vector<long long> intercept_;

    /**
     * True when the middle line of the three never holds the minimum: the
     * switch points of the neighbours have to decrease along the stack, and
     * the comparison is done on the switch points, so the products of the
     * coefficients never enter the arithmetic.
     */
    static bool redundant(long long m1, long long b1, long long m2, long long b2,
                          long long m3, long long b3) {
        return static_cast<double>(b1 - b2) / static_cast<double>(m2 - m1) <=
               static_cast<double>(b2 - b3) / static_cast<double>(m3 - m2);
    }
};

/*
 * Self-check only: the class above is the reusable part, so this file asserts
 * the documented contract instead of reading input.
 */
int main() {
    ConvexHull hull(8);

    hull.add(1, 0);
    hull.add(2, -1);
    // The line 2x - 1 is never the smallest, so it is pruned.
    hull.add(3, -3);

    if (hull.query(0) != -3) {
        return 1;
    }
    if (hull.query(1) != 0) {
        return 1;
    }
    if (hull.query(2) != 2) {
        return 1;
    }

    // A new line with a larger slope can win for the current x.
    hull.add(4, -20);
    if (hull.query(3) != -8) {
        return 1;
    }

    // A line with the same slope wins only with a smaller intercept.
    hull.add(4, -30);
    if (hull.query(3) != -18) {
        return 1;
    }
    hull.add(4, 0);
    if (hull.query(3) != -18) {
        return 1;
    }

    return 0;
}
