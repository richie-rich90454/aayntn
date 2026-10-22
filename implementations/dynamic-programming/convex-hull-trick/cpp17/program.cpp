#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

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
     * switch points of the neighbors have to decrease along the stack, and
     * the comparison is done on the switch points, so the products of the
     * coefficients never enter the arithmetic.
     */
    static bool redundant(long long m1, long long b1, long long m2, long long b2,
                          long long m3, long long b3) {
        return static_cast<double>(b1 - b2) / static_cast<double>(m2 - m1) <=
               static_cast<double>(b2 - b3) / static_cast<double>(m3 - m2);
    }
};

int main() {
    /*
     * The language variants must agree byte for byte, so the line feed must
     * not depend on the platform: binary mode keeps "\n" from becoming
     * "\r\n" on Windows.
     */
#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int q = 0;
    if (!(std::cin >> n >> q)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }
    if (q < 0) {
        q = 0;
    }

    ConvexHull hull(n);

    for (int i = 0; i < n; ++i) {
        long long m = 0;
        long long b = 0;
        if (!(std::cin >> m >> b)) {
            break;
        }
        hull.add(m, b);
    }

    for (int k = 0; k < q; ++k) {
        long long x = 0;
        if (!(std::cin >> x)) {
            break;
        }
        std::cout << hull.query(x) << '\n';
    }

    return 0;
}
