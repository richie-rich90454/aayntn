#include <algorithm>
#include <iostream>
#include <vector>

#ifdef _WIN32
#include <fcntl.h>
#include <io.h>
#endif

namespace {

constexpr long long INF = 4000000000000000000LL;

/*
 * dp[g][i] = min over j < i of dp[g - 1][j] + (prefix[i] - prefix[j])^2.
 *
 * The best j never moves left as i grows, so the middle entry of a range is
 * solved directly and its optimal split point becomes the candidate bound of
 * both halves.
 */
class Solver {
public:
    explicit Solver(int n) : prefix_(n + 1, 0), previous_(n + 1, INF), current_(n + 1, INF) {
        for (int i = 1; i <= n; ++i) {
            long long value = 0;
            std::cin >> value;
            prefix_[i] = prefix_[i - 1] + value;
        }
    }

    long long run(int k) {
        const int n = static_cast<int>(prefix_.size()) - 1;
        previous_[0] = 0;

        for (int g = 1; g <= k; ++g) {
            std::fill(current_.begin(), current_.end(), INF);
            /*
             * Layer g only needs prefixes that leave at least k - g elements
             * for the remaining groups.
             */
            const int last = n - k + g;
            solve_layer(g, last, g - 1, last - 1);
            previous_.swap(current_);
        }
        return previous_[n];
    }

private:
    std::vector<long long> prefix_;
    std::vector<long long> previous_;
    std::vector<long long> current_;

    void solve_layer(int left, int right, int opt_left, int opt_right) {
        if (left > right) {
            return;
        }

        const int mid = left + (right - left) / 2;
        const int upper = std::min(opt_right, mid - 1);
        long long best = INF;
        int best_j = opt_left;

        for (int j = opt_left; j <= upper; ++j) {
            const long long difference = prefix_[mid] - prefix_[j];
            const long long candidate = previous_[j] + difference * difference;
            if (candidate < best) {
                best = candidate;
                best_j = j;
            }
        }

        current_[mid] = best;
        /*
         * best_j is the smallest optimal split point of mid, so every entry to
         * the left uses a split point at most best_j and every entry to the
         * right uses one at least best_j.
         */
        solve_layer(left, mid - 1, opt_left, best_j);
        solve_layer(mid + 1, right, best_j, opt_right);
    }
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

#ifdef _WIN32
    _setmode(_fileno(stdout), _O_BINARY);
#endif

    int n = 0;
    int k = 0;
    if (!(std::cin >> n >> k)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << "0\n";
        return 0;
    }
    if (k < 1) {
        k = 1;
    }
    if (k > n) {
        k = n;
    }

    Solver solver(n);
    std::cout << solver.run(k) << '\n';
    return 0;
}
