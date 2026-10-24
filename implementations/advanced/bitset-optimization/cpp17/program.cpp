#include <cstdint>
#include <cstdio>
#include <vector>

namespace {

constexpr int kWordBits = 32;

}  // namespace

int main() {
    int n = 0;
    long long limit = 0;
    if (std::scanf("%d %lld", &n, &limit) != 2) {
        return 0;
    }

    const int words = static_cast<int>(limit / kWordBits) + 1;
    const int topBits = static_cast<int>(limit % kWordBits) + 1;

    std::vector<std::uint32_t> reachable(static_cast<std::size_t>(words), 0u);
    reachable[0] = 1u;

    for (int k = 0; k < n; ++k) {
        long long weight = 0;
        if (std::scanf("%lld", &weight) != 1) {
            return 0;
        }
        if (weight <= 0 || weight > limit) {
            continue;
        }

        const int wordShift = static_cast<int>(weight / kWordBits);
        const int bitShift = static_cast<int>(weight % kWordBits);

        for (int i = words - 1; i >= wordShift; --i) {
            std::uint32_t moved = reachable[i - wordShift] << bitShift;
            if (bitShift > 0 && i - wordShift - 1 >= 0) {
                moved |= reachable[i - wordShift - 1] >> (kWordBits - bitShift);
            }
            reachable[i] |= moved;
        }

        if (topBits < kWordBits) {
            reachable[words - 1] &= (1u << topBits) - 1u;
        }
    }

    long long answer = 0;
    for (int i = 0; i < words; ++i) {
        answer += __builtin_popcount(reachable[i]);
    }
    std::printf("%lld\n", answer);
    return 0;
}
