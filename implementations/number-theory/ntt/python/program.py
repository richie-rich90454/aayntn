import sys


def ntt(a, invert, mod):
    n = len(a)
    j = 0
    for i in range(1, n):
        bit = n >> 1
        while j & bit:
            j ^= bit
            bit >>= 1
        j ^= bit
        if i < j:
            a[i], a[j] = a[j], a[i]

    length = 2
    while length <= n:
        wlen = pow(3, (mod - 1) // length, mod)
        if invert:
            wlen = pow(wlen, mod - 2, mod)
        half = length >> 1
        for start in range(0, n, length):
            w = 1
            for k in range(start, start + half):
                u = a[k]
                v = a[k + half] * w % mod
                a[k] = (u + v) % mod
                a[k + half] = (u - v) % mod
                w = w * wlen % mod
        length <<= 1

    if invert:
        inv_n = pow(n, mod - 2, mod)
        for i in range(n):
            a[i] = a[i] * inv_n % mod


def main():
    data = list(map(int, sys.stdin.buffer.read().split()))
    if len(data) < 3:
        return
    n, m, mod = data[0], data[1], data[2]
    if n <= 0 or m <= 0:
        return

    coefficients = data[3:]
    a_values = coefficients[:n]
    b_values = coefficients[n : n + m]

    total = n + m - 1
    size = 1
    while size < total:
        size <<= 1

    a = a_values + [0] * (size - n)
    b = b_values + [0] * (size - m)

    ntt(a, False, mod)
    ntt(b, False, mod)
    for i in range(size):
        a[i] = a[i] * b[i] % mod
    ntt(a, True, mod)

    print(" ".join(str(a[i]) for i in range(total)), end="\n")


if __name__ == "__main__":
    main()
