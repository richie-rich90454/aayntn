#include <iostream>
#include <vector>

namespace {

// Counts the pairs i < j with values[i] + values[j] <= target.
long long count_pairs(const std::vector<long long>& values, long long target)
{
    long long total = 0;
    int left = 0;
    int right = static_cast<int>(values.size()) - 1;

    while (left < right) {
        if (values[left] + values[right] <= target) {
            total += static_cast<long long>(right - left);
            ++left;
        } else {
            --right;
        }
    }
    return total;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;

    if (!(std::cin >> n) || n < 0) {
        std::cout << "0\n";
        return 0;
    }

    std::vector<long long> values(n);

    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> values[i])) {
            std::cout << "0\n";
            return 0;
        }
    }

    long long target;

    if (!(std::cin >> target)) {
        std::cout << "0\n";
        return 0;
    }

    std::cout << count_pairs(values, target) << "\n";
    return 0;
}
