"""Multiply two polynomials with the iterative radix-2 complex FFT.

Input: n, the n coefficients of the first polynomial, m, and the m
coefficients of the second.
Output: the n + m - 1 coefficients of the product, rounded to integers.
"""

import math
import sys


def fft(re, im, invert):
    """Transform in place. A negative angle is the inverse transform."""
    n = len(re)

    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            re[i], re[j] = re[j], re[i]
            im[i], im[j] = im[j], im[i]

    length = 2
    while length <= n:
        angle = (-2.0 if invert else 2.0) * math.pi / length
        wlen_re = math.cos(angle)
        wlen_im = math.sin(angle)
        half = length >> 1
        for start in range(0, n, length):
            w_re = 1.0
            w_im = 0.0
            for k in range(half):
                u_re = re[start + k]
                u_im = im[start + k]
                v_re = re[start + k + half] * w_re - im[start + k + half] * w_im
                v_im = re[start + k + half] * w_im + im[start + k + half] * w_re
                re[start + k] = u_re + v_re
                im[start + k] = u_im + v_im
                re[start + k + half] = u_re - v_re
                im[start + k + half] = u_im - v_im
                w_re, w_im = (
                    w_re * wlen_re - w_im * wlen_im,
                    w_re * wlen_im + w_im * wlen_re,
                )
        length <<= 1

    if invert:
        for i in range(n):
            re[i] /= n
            im[i] /= n


def round_half_away(x):
    """Round to nearest, with exact halves going away from zero."""
    return math.floor(x + 0.5) if x >= 0.0 else math.ceil(x - 0.5)


def main():
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    values = [int(token) for token in data]

    at = 0
    n = values[at]
    at += 1
    a = values[at : at + n]
    at += n
    m = values[at]
    at += 1
    b = values[at : at + m]

    total = n + m - 1
    size = 1
    while size < total:
        size <<= 1

    re_a = [0.0] * size
    im_a = [0.0] * size
    re_b = [0.0] * size
    im_b = [0.0] * size
    for i in range(n):
        re_a[i] = a[i]
    for i in range(m):
        re_b[i] = b[i]

    fft(re_a, im_a, False)
    fft(re_b, im_b, False)
    for i in range(size):
        re_a[i], im_a[i] = (
            re_a[i] * re_b[i] - im_a[i] * im_b[i],
            re_a[i] * im_b[i] + im_a[i] * re_b[i],
        )
    fft(re_a, im_a, True)

    sys.stdout.write(" ".join(str(round_half_away(x)) for x in re_a[:total]) + "\n")


if __name__ == "__main__":
    main()
