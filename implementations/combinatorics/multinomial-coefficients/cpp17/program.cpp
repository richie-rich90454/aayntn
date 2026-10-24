#include <array>
#include <iostream>
#include <string>
#include <vector>

namespace {
constexpr long long kModulo = 1000000007LL;

long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= kModulo;
    while (exponent > 0) {
        if (exponent % 2 == 1) {
            result = result * base % kModulo;
        }
        base = base * base % kModulo;
        exponent /= 2;
    }
    return result;
}
}  // namespace

int main() {
    std::string word;
    if (!(std::cin >> word)) {
        word.clear();
    }
    const int n = static_cast<int>(word.size());

    std::array<int, 26> frequency{};
    for (char c : word) {
        ++frequency[static_cast<size_t>(c - 'a')];
    }

    std::vector<long long> factorial(static_cast<size_t>(n) + 1, 1);
    std::vector<long long> inverse_factorial(static_cast<size_t>(n) + 1, 1);
    for (int i = 1; i <= n; ++i) {
        factorial[static_cast<size_t>(i)] =
            factorial[static_cast<size_t>(i - 1)] * i % kModulo;
    }

    inverse_factorial[static_cast<size_t>(n)] =
        mod_pow(factorial[static_cast<size_t>(n)], kModulo - 2);
    for (int i = n; i >= 1; --i) {
        inverse_factorial[static_cast<size_t>(i - 1)] =
            inverse_factorial[static_cast<size_t>(i)] * i % kModulo;
    }

    long long answer = factorial[static_cast<size_t>(n)];
    for (int count : frequency) {
        answer = answer * inverse_factorial[static_cast<size_t>(count)] % kModulo;
    }

    std::cout << answer << '\n';
    return 0;
}
