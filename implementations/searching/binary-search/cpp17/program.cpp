#include <iostream>
#include <vector>

/*
 * Binary search driver.
 *
 * Reads n, a sorted run of integers and a target from standard input, then
 * prints the 0-based index of the target, or -1 when it is absent.
 */

namespace {

int binary_search(const std::vector<long long>& a, long long target)
{
    int lo = 0;
    int hi = static_cast<int>(a.size()) - 1;

    while (lo <= hi) {
        const int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) {
            return mid;
        }
        if (a[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return -1;
}

}  // namespace

int main()
{
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::vector<long long> values;
    long long value;
    while (std::cin >> value) {
        values.push_back(value);
    }

    /*
     * The target is the final token and the array takes at most n of the
     * tokens before it, so a header that disagrees with the data cannot
     * swallow the target.
     */
    if (values.size() < 2) {
        std::cout << "-1\n";
        return 0;
    }

    const long long declared = values.front();
    const long long target = values.back();
    const long long available = static_cast<long long>(values.size()) - 2;
    long long array_length = declared < available ? declared : available;
    if (array_length < 0) {
        array_length = 0;
    }

    const std::vector<long long> a(values.begin() + 1, values.begin() + 1 + array_length);
    std::cout << binary_search(a, target) << "\n";
    return 0;
}
