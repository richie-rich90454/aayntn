#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

namespace {

constexpr std::int64_t MODULO = 1000000007LL;

std::int64_t powerMod(std::int64_t base, std::int64_t exponent) {
    std::int64_t result = 1;
    base %= MODULO;
    while (exponent > 0) {
        if (exponent & 1LL) {
            result = result * base % MODULO;
        }
        base = base * base % MODULO;
        exponent >>= 1;
    }
    return result;
}

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n) || n <= 0) {
        return 0;
    }

    std::vector<std::int64_t> sequence(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        if (!(std::cin >> sequence[i])) {
            return 0;
        }
        sequence[i] %= MODULO;
        if (sequence[i] < 0) {
            sequence[i] += MODULO;
        }
    }

    std::vector<std::int64_t> current(1, 1);
    std::vector<std::int64_t> backup(1, 1);
    int order = 0;
    int shift = 1;
    std::int64_t lastDiscrepancy = 1;

    for (int i = 0; i < n; ++i) {
        std::int64_t discrepancy = 0;
        for (int j = 0; j <= order && j <= i; ++j) {
            discrepancy = (discrepancy + current[j] * sequence[i - j]) % MODULO;
        }
        if (discrepancy == 0) {
            ++shift;
            continue;
        }

        const std::vector<std::int64_t> saved = current;
        const std::int64_t coefficient =
            discrepancy * powerMod(lastDiscrepancy, MODULO - 2) % MODULO;

        if (current.size() < backup.size() + static_cast<std::size_t>(shift)) {
            current.resize(backup.size() + static_cast<std::size_t>(shift), 0);
        }
        for (std::size_t j = 0; j < backup.size(); ++j) {
            current[j + static_cast<std::size_t>(shift)] =
                (current[j + static_cast<std::size_t>(shift)] -
                 coefficient * backup[j] % MODULO + MODULO) %
                MODULO;
        }

        if (2 * order <= i) {
            order = i + 1 - order;
            backup = saved;
            lastDiscrepancy = discrepancy;
            shift = 1;
        } else {
            ++shift;
        }
    }

    std::int64_t nextTerm = 0;
    for (int j = 1; j <= order && j <= n; ++j) {
        nextTerm = (nextTerm + current[j] * sequence[n - j]) % MODULO;
    }
    if (nextTerm != 0) {
        nextTerm = MODULO - nextTerm;
    }

    std::cout << order << ' ' << nextTerm << '\n';
    return 0;
}
