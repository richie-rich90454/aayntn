#include <math.h>
#include <stdio.h>
#include <stdlib.h>

static const double TWO_PI = 6.283185307179586476925286766559;

/*
 * The iterative radix-2 Cooley-Tukey transform, in place. A positive angle
 * is the forward transform and a negative angle is the inverse, which is
 * then divided by n. The bit-reversal permutation comes first, so the
 * butterflies can run bottom-up over the whole array.
 */
static void fft(double *re, double *im, int n, int invert) {
    int i;
    int j = 0;
    for (i = 1; i < n; i++) {
        int bit = n >> 1;
        while (j & bit) {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if (i < j) {
            double t = re[i];
            re[i] = re[j];
            re[j] = t;
            t = im[i];
            im[i] = im[j];
            im[j] = t;
        }
    }

    for (int len = 2; len <= n; len <<= 1) {
        const double angle = (invert ? -TWO_PI : TWO_PI) / (double)len;
        const double wlen_re = cos(angle);
        const double wlen_im = sin(angle);
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
        for (i = 0; i < n; i++) {
            re[i] /= (double)n;
            im[i] /= (double)n;
        }
    }
}

/* Round to nearest, with exact halves going away from zero. */
static long long round_half_away(double x) {
    return (long long)(x >= 0.0 ? x + 0.5 : x - 0.5);
}

int main(void) {
    int n;
    int m;
    if (scanf("%d", &n) != 1 || n <= 0) {
        return 0;
    }

    double *a_re = calloc((size_t)n, sizeof(double));
    double *a_im = calloc((size_t)n, sizeof(double));
    for (int i = 0; i < n; i++) {
        if (scanf("%lf", &a_re[i]) != 1) {
            return 0;
        }
    }

    if (scanf("%d", &m) != 1 || m <= 0) {
        return 0;
    }
    double *b_re = calloc((size_t)m, sizeof(double));
    double *b_im = calloc((size_t)m, sizeof(double));
    for (int i = 0; i < m; i++) {
        if (scanf("%lf", &b_re[i]) != 1) {
            return 0;
        }
    }

    const int total = n + m - 1;
    int size = 1;
    while (size < total) {
        size <<= 1;
    }
    a_re = realloc(a_re, (size_t)size * sizeof(double));
    a_im = realloc(a_im, (size_t)size * sizeof(double));
    b_re = realloc(b_re, (size_t)size * sizeof(double));
    b_im = realloc(b_im, (size_t)size * sizeof(double));
    for (int i = n; i < size; i++) {
        a_re[i] = 0.0;
        a_im[i] = 0.0;
    }
    for (int i = m; i < size; i++) {
        b_re[i] = 0.0;
        b_im[i] = 0.0;
    }

    fft(a_re, a_im, size, 0);
    fft(b_re, b_im, size, 0);
    for (int i = 0; i < size; i++) {
        const double re = a_re[i] * b_re[i] - a_im[i] * b_im[i];
        const double im = a_re[i] * b_im[i] + a_im[i] * b_re[i];
        a_re[i] = re;
        a_im[i] = im;
    }
    fft(a_re, a_im, size, 1);

    for (int i = 0; i < total; i++) {
        if (i > 0) {
            putchar(' ');
        }
        printf("%lld", round_half_away(a_re[i]));
    }
    putchar('\n');

    free(a_re);
    free(a_im);
    free(b_re);
    free(b_im);
    return 0;
}
