#include <iostream>
#include <vector>

/*
 * The hook-length formula: n! divided by the product of the hook lengths
 * of all cells, with the division performed by a Fermat inverse.
 */
namespace {
constexpr long long kModulus = 1000000007LL;

long long mod_pow(long long base, long long exponent) {
    long long result = 1;
    base %= kModulus;
    while (exponent > 0) {
        if ((exponent & 1LL) != 0) {
            result = result * base % kModulus;
        }
        base = base * base % kModulus;
        exponent >>= 1;
    }
    return result;
}
}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int k = 0;
    if (!(std::cin >> k) || k < 0) {
        return 0;
    }

    std::vector<int> rows(k);
    long long n = 0;
    for (int i = 0; i < k; i++) {
        if (!(std::cin >> rows[i]) || rows[i] < 0) {
            return 0;
        }
        n += rows[i];
    }

    const int width = (k > 0) ? rows[0] : 0;
    std::vector<int> heights(width, 0);
    for (int i = 0; i < k; i++) {
        for (int j = 0; j < rows[i]; j++) {
            heights[j]++;
        }
    }

    long long numerator = 1;
    for (long long i = 2; i <= n; i++) {
        numerator = numerator * (i % kModulus) % kModulus;
    }

    long long denominator = 1;
    for (int i = 0; i < k; i++) {
        for (int j = 0; j < rows[i]; j++) {
            const long long hook = static_cast<long long>(rows[i]) - j + heights[j] - i - 1;
            denominator = denominator * (hook % kModulus) % kModulus;
        }
    }

    const long long answer = numerator * mod_pow(denominator, kModulus - 2) % kModulus;
    std::cout << answer << '\n';
    return 0;
}
