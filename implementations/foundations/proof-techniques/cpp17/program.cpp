#include <iostream>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long n = 0;
    if (!(std::cin >> n) || n < 0) {
        return 0;
    }

    long long square = n * n;
    long long total = 0;
    for (long long k = 1; k <= n; ++k) {
        total += 2 * k - 1;
    }

    std::cout << square << '\n' << total << '\n';
    std::cout << (square == total ? "MATCH" : "DIFFER") << '\n';
    return 0;
}
