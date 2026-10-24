/*
 * Randomized quicksort with a three-way partition and a xorshift32 generator.
 * The generator is seeded with 2463534242 so that the six language variants
 * take the same pivots and report the same comparison count.
 */

#include <cstdint>
#include <cstdio>
#include <vector>

namespace {

std::uint32_t rng_state = 2463534242u;
long long comparisons = 0;

std::uint32_t next_random() {
    std::uint32_t x = rng_state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    rng_state = x;
    return x;
}

void swap_values(int &left, int &right) {
    int temporary = left;
    left = right;
    right = temporary;
}

void randomized_quicksort(std::vector<int> &a, int lo, int hi) {
    if (lo >= hi) return;

    int pivot = a[lo + static_cast<int>(next_random() % static_cast<std::uint32_t>(hi - lo + 1))];
    int lt = lo;
    int i = lo;
    int gt = hi;

    while (i <= gt) {
        ++comparisons;
        if (a[i] < pivot) {
            swap_values(a[lt], a[i]);
            ++lt;
            ++i;
        } else if (a[i] > pivot) {
            swap_values(a[i], a[gt]);
            --gt;
        } else {
            ++i;
        }
    }

    randomized_quicksort(a, lo, lt - 1);
    randomized_quicksort(a, gt + 1, hi);
}

}  // namespace

int main() {
    int n = 0;
    if (std::scanf("%d", &n) != 1 || n <= 0) return 0;

    std::vector<int> a(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i) {
        if (std::scanf("%d", &a[static_cast<std::size_t>(i)]) != 1) return 1;
    }

    randomized_quicksort(a, 0, n - 1);

    for (int i = 0; i < n; ++i) {
        if (i > 0) std::putchar(' ');
        std::printf("%d", a[static_cast<std::size_t>(i)]);
    }
    std::putchar('\n');
    std::printf("%lld\n", comparisons);
    return 0;
}
