#include <cstdlib>
#include <vector>

/*
 * Prefix sums over a vector of values.
 *
 * Contract: the returned vector holds n+1 entries with prefix[0] = 0 and
 * prefix[i] = prefix[i-1] + a[i-1] for every 1 <= i <= n, so the sum of
 * a[l-1 .. r-1] is prefix[r] - prefix[l-1].
 */
std::vector<long long> prefix_sums(const std::vector<long long>& a)
{
    std::vector<long long> prefix(a.size() + 1, 0);
    for (std::size_t i = 0; i < a.size(); i++) {
        prefix[i + 1] = prefix[i] + a[i];
    }
    return prefix;
}

/*
 * Self-check only: the routine above is the reusable part, so this file
 * asserts the documented contract instead of reading input.
 */
int main()
{
    const std::vector<long long> sample{1, 2, 3, 4, 5};
    const std::vector<long long> prefix = prefix_sums(sample);

    if (prefix[0] != 0 || prefix[1] != 1 || prefix[5] != 15) {
        return EXIT_FAILURE;
    }
    /* A range sum is the difference of two prefix entries. */
    if (prefix[3] - prefix[1] != 5) {
        return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
