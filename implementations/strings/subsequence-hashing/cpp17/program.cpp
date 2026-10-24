#include <iostream>
#include <string>
#include <vector>

/*
 * String hashing of subsequences.
 *
 * Input: one string s, a query count q, and q pairs of 0-based indices.
 * Output: SAME when deleting s[i] and deleting s[j] leave the same string,
 * DIFFERENT otherwise.
 *
 * The hash of the string with s[i] deleted is the hash of the prefix before i
 * shifted by the length of the remaining suffix, plus the hash of the suffix
 * after i. Both pieces come from tables built once, so a query is constant
 * time.
 */

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;
    if (!(std::cin >> s)) {
        return 0;
    }
    const int n = static_cast<int>(s.size());
    const long long base = 8000011LL;
    const long long mod = 90000049LL;

    std::vector<long long> power(n + 1);
    std::vector<long long> prefix(n + 1);
    std::vector<long long> suffix(n + 1);

    power[0] = 1;
    for (int i = 1; i <= n; ++i) {
        power[i] = power[i - 1] * base % mod;
    }
    for (int i = 0; i < n; ++i) {
        prefix[i + 1] = (prefix[i] * base + (s[i] - 'a' + 1)) % mod;
    }
    for (int i = n - 1; i >= 0; --i) {
        suffix[i] = ((s[i] - 'a' + 1) * power[n - 1 - i] + suffix[i + 1]) % mod;
    }

    int q;
    std::cin >> q;
    while (q-- > 0) {
        int i;
        int j;
        std::cin >> i >> j;
        const long long di = (prefix[i] * power[n - 1 - i] + suffix[i + 1]) % mod;
        const long long dj = (prefix[j] * power[n - 1 - j] + suffix[j + 1]) % mod;
        std::cout << (di == dj ? "SAME\n" : "DIFFERENT\n");
    }
    return 0;
}
