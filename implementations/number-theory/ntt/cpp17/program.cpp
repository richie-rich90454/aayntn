#include <cstdio>
#include <vector>

namespace {

const long long ROOT = 3;

long long mod_pow(long long a, long long e, long long mod) {
    long long result = 1;
    a %= mod;
    while (e > 0) {
        if ((e & 1) != 0) {
            result = result * a % mod;
        }
        a = a * a % mod;
        e >>= 1;
    }
    return result;
}

void ntt(std::vector<long long> &a, bool invert, long long mod) {
    const int n = static_cast<int>(a.size());
    for (int i = 1, j = 0; i < n; i++) {
        int bit = n >> 1;
        while ((j & bit) != 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            const long long t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
    }

    for (int len = 2; len <= n; len <<= 1) {
        long long wlen = mod_pow(ROOT, (mod - 1) / len, mod);
        if (invert) {
            wlen = mod_pow(wlen, mod - 2, mod);
        }
        const int half = len >> 1;
        for (int start = 0; start < n; start += len) {
            long long w = 1;
            for (int k = 0; k < half; k++) {
                const long long u = a[start + k];
                const long long v = a[start + k + half] * w % mod;
                a[start + k] = (u + v) % mod;
                a[start + k + half] = (u - v + mod) % mod;
                w = w * wlen % mod;
            }
        }
    }

    if (invert) {
        const long long inv_n = mod_pow(n, mod - 2, mod);
        for (int i = 0; i < n; i++) {
            a[i] = a[i] * inv_n % mod;
        }
    }
}

} // namespace

int main() {
    int n = 0;
    int m = 0;
    long long mod = 0;
    if (std::scanf("%d %d %lld", &n, &m, &mod) != 3 || n <= 0 || m <= 0) {
        return 0;
    }

    const int total = n + m - 1;
    int size = 1;
    while (size < total) {
        size <<= 1;
    }

    std::vector<long long> a(size, 0);
    std::vector<long long> b(size, 0);
    for (int i = 0; i < n; i++) {
        if (std::scanf("%lld", &a[i]) != 1) {
            return 0;
        }
    }
    for (int i = 0; i < m; i++) {
        if (std::scanf("%lld", &b[i]) != 1) {
            return 0;
        }
    }

    ntt(a, false, mod);
    ntt(b, false, mod);
    for (int i = 0; i < size; i++) {
        a[i] = a[i] * b[i] % mod;
    }
    ntt(a, true, mod);

    for (int i = 0; i < total; i++) {
        std::printf("%lld%c", a[i], i + 1 == total ? '\n' : ' ');
    }
    return 0;
}
