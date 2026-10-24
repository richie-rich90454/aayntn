#include <stdio.h>

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

#define MAX_LENGTH 1000000
#define BASE 8000011LL
#define MOD 90000049LL

static char s[MAX_LENGTH + 2];
static long long prefix_hash[MAX_LENGTH + 2];
static long long suffix_hash[MAX_LENGTH + 2];
static long long power[MAX_LENGTH + 2];

int main(void) {
    if (scanf("%1000001s", s) != 1) {
        return 0;
    }
    int n = 0;
    while (s[n] != '\0') {
        ++n;
    }

    power[0] = 1;
    for (int i = 1; i <= n; ++i) {
        power[i] = power[i - 1] * BASE % MOD;
    }
    prefix_hash[0] = 0;
    for (int i = 0; i < n; ++i) {
        long long value = (long long)(s[i] - 'a' + 1);
        prefix_hash[i + 1] = (prefix_hash[i] * BASE + value) % MOD;
    }
    suffix_hash[n] = 0;
    for (int i = n - 1; i >= 0; --i) {
        long long value = (long long)(s[i] - 'a' + 1);
        suffix_hash[i] = (value * power[n - 1 - i] + suffix_hash[i + 1]) % MOD;
    }

    int q;
    if (scanf("%d", &q) != 1) {
        return 0;
    }
    while (q-- > 0) {
        int i;
        int j;
        if (scanf("%d %d", &i, &j) != 2) {
            return 0;
        }
        long long di = (prefix_hash[i] * power[n - 1 - i] + suffix_hash[i + 1]) % MOD;
        long long dj = (prefix_hash[j] * power[n - 1 - j] + suffix_hash[j + 1]) % MOD;
        puts(di == dj ? "SAME" : "DIFFERENT");
    }
    return 0;
}
