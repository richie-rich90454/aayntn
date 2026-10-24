#include <cmath>
#include <cstdio>
#include <utility>
#include <vector>

namespace {

const double TWO_PI = 6.283185307179586476925286766559;

/*
 * The iterative radix-2 Cooley-Tukey transform, in place. A positive angle
 * is the forward transform and a negative angle is the inverse, which is
 * then divided by n. The bit-reversal permutation comes first, so the
 * butterflies can run bottom-up over the whole array.
 */
void fft(std::vector<double> &re, std::vector<double> &im, bool invert) {
    const int n = static_cast<int>(re.size());

    int j = 0;
    for (int i = 1; i < n; i++) {
        int bit = n >> 1;
        while ((j & bit) != 0) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            std::swap(re[i], re[j]);
            std::swap(im[i], im[j]);
        }
    }

    for (int len = 2; len <= n; len <<= 1) {
        const double angle = (invert ? -TWO_PI : TWO_PI) / static_cast<double>(len);
        const double wlen_re = std::cos(angle);
        const double wlen_im = std::sin(angle);
        const int half = len >> 1;
        for (int start = 0; start < n; start += len) {
            double w_re = 1.0;
            double w_im = 0.0;
            for (int k = 0; k < half; k++) {
                const double u_re = re[start + k];
                const double u_im = im[start + k];
                const double v_re =
                    re[start + k + half] * w_re - im[start + k + half] * w_im;
                const double v_im =
                    re[start + k + half] * w_im + im[start + k + half] * w_re;
                re[start + k] = u_re + v_re;
                im[start + k] = u_im + v_im;
                re[start + k + half] = u_re - v_re;
                im[start + k + half] = u_im - v_im;
                const double next_re = w_re * wlen_re - w_im * wlen_im;
                w_im = w_re * wlen_im + w_im * wlen_re;
                w_re = next_re;
            }
        }
    }

    if (invert) {
        for (int i = 0; i < n; i++) {
            re[i] /= static_cast<double>(n);
            im[i] /= static_cast<double>(n);
        }
    }
}

/* Round to nearest, with exact halves going away from zero. */
long long round_half_away(double x) {
    return static_cast<long long>(x >= 0.0 ? x + 0.5 : x - 0.5);
}

}  // namespace

int main() {
    int n = 0;
    if (std::scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    std::vector<double> a_re(static_cast<std::size_t>(n));
    std::vector<double> a_im(static_cast<std::size_t>(n), 0.0);
    for (int i = 0; i < n; i++) {
        if (std::scanf("%lf", &a_re[i]) != 1) {
            return 0;
        }
    }

    int m = 0;
    if (std::scanf("%d", &m) != 1 || m <= 0) {
        return 0;
    }
    std::vector<double> b_re(static_cast<std::size_t>(m));
    std::vector<double> b_im(static_cast<std::size_t>(m), 0.0);
    for (int i = 0; i < m; i++) {
        if (std::scanf("%lf", &b_re[i]) != 1) {
            return 0;
        }
    }

    const int total = n + m - 1;
    int size = 1;
    while (size < total) {
        size <<= 1;
    }
    a_re.resize(static_cast<std::size_t>(size), 0.0);
    a_im.resize(static_cast<std::size_t>(size), 0.0);
    b_re.resize(static_cast<std::size_t>(size), 0.0);
    b_im.resize(static_cast<std::size_t>(size), 0.0);

    fft(a_re, a_im, false);
    fft(b_re, b_im, false);
    for (int i = 0; i < size; i++) {
        const double re = a_re[i] * b_re[i] - a_im[i] * b_im[i];
        const double im = a_re[i] * b_im[i] + a_im[i] * b_re[i];
        a_re[i] = re;
        a_im[i] = im;
    }
    fft(a_re, a_im, true);

    for (int i = 0; i < total; i++) {
        if (i > 0) {
            std::putchar(' ');
        }
        std::printf("%lld", round_half_away(a_re[i]));
    }
    std::putchar('\n');
    return 0;
}
