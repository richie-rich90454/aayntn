#include <iostream>
#include <vector>

/*
 * Parametric search driver.
 *
 * Reads n, n nonnegative values and a budget, then prints the largest level x
 * whose capped sum, the sum of min(a[i], x), is at most the budget.
 */

namespace {

bool feasible(const std::vector<long long>& a, long long x, long long budget)
{
    long long total = 0;

    for (long long value : a) {
        total += value < x ? value : x;
        if (total > budget) {
            return false;
        }
    }
    return true;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;

    if (!(std::cin >> n) || n <= 0) {
        std::cout << "0\n";
        return 0;
    }

    std::vector<long long> a(n);
    long long max_value = 0;

    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> a[i])) {
            a[i] = 0;
        }
        if (a[i] > max_value) {
            max_value = a[i];
        }
    }

    long long budget = 0;

    if (!(std::cin >> budget)) {
        budget = 0;
    }

    long long lo = 0;
    long long hi = max_value;
    long long answer = 0;

    while (lo <= hi) {
        const long long mid = lo + (hi - lo) / 2;

        if (feasible(a, mid, budget)) {
            answer = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    std::cout << answer << "\n";
    return 0;
}
