#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    long long capacity = 0;
    if (!(std::cin >> n >> capacity)) {
        return 0;
    }
    if (n <= 0) {
        std::cout << 0 << '\n';
        return 0;
    }

    std::vector<long long> weights(static_cast<size_t>(n));
    for (long long &weight : weights) {
        if (!(std::cin >> weight)) {
            return 0;
        }
    }

    std::sort(weights.begin(), weights.end());

    long long used = 0;
    int count = 0;
    for (long long weight : weights) {
        if (weight > capacity - used) {
            break;
        }
        used += weight;
        ++count;
    }

    std::cout << count << '\n';
    return 0;
}
