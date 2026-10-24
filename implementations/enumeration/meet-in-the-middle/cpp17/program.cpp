#include <algorithm>
#include <cstddef>
#include <iostream>
#include <vector>

static std::vector<long long> subsetSums(const std::vector<long long> &values, int from, int to) {
    std::vector<long long> sums{0};
    for (int i = from; i < to; ++i) {
        const std::size_t size = sums.size();
        sums.resize(size * 2);
        for (std::size_t j = 0; j < size; ++j) {
            sums[size + j] = sums[j] + values[i];
        }
    }
    return sums;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n;
    long long limit;
    if (!(std::cin >> n >> limit)) {
        return 0;
    }
    if (n < 0 || n > 40) {
        return 0;
    }
    std::vector<long long> values(n);
    for (long long &value : values) {
        if (!(std::cin >> value)) {
            return 0;
        }
    }

    const int middle = n / 2;
    std::vector<long long> left = subsetSums(values, 0, middle);
    std::vector<long long> right = subsetSums(values, middle, n);

    std::sort(right.begin(), right.end());

    long long answer = 0;
    for (long long value : left) {
        answer += std::upper_bound(right.begin(), right.end(), limit - value) - right.begin();
    }
    std::cout << answer << '\n';
    return 0;
}
