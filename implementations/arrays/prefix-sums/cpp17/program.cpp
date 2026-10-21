#include <iostream>
#include <vector>

/*
 * Prefix sums driver.
 *
 * Reads n, the n array values, q and then q 1-based inclusive ranges from
 * standard input, and prints one range sum per line.
 */

namespace {

/*
 * Builds the running totals of a: the result holds a.size() + 1 entries
 * with prefix[0] = 0 and prefix[i] = prefix[i-1] + a[i-1].
 */
std::vector<long long> prefix_sums(const std::vector<long long>& a)
{
    std::vector<long long> prefix(a.size() + 1, 0);
    for (std::size_t i = 0; i < a.size(); i++) {
        prefix[i + 1] = prefix[i] + a[i];
    }
    return prefix;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) {
        return 0;
    }
    if (n < 0) {
        n = 0;
    }

    /* The values start at zero, so a truncated input leaves zeros behind. */
    std::vector<long long> a(n, 0);
    for (int i = 0; i < n; i++) {
        if (!(std::cin >> a[i])) {
            break;
        }
    }

    const std::vector<long long> prefix = prefix_sums(a);

    int q = 0;
    if (!(std::cin >> q)) {
        q = 0;
    }
    if (q < 0) {
        q = 0;
    }

    for (int j = 0; j < q; j++) {
        int l = 0;
        int r = 0;
        if (!(std::cin >> l >> r)) {
            break;
        }
        /* A range that leaves the array is clipped, so the lookup stays in
           bounds; a range that is empty after clipping sums to zero. */
        if (l < 1) {
            l = 1;
        }
        if (r > n) {
            r = n;
        }
        if (l > r) {
            std::cout << "0\n";
            continue;
        }
        std::cout << prefix[r] - prefix[l - 1] << "\n";
    }
    return 0;
}
