import sys

MODULO = 1000000007


def binomial(n: int, k: int) -> int:
    if k < 0 or k > n:
        return 0
    k = min(k, n - k)
    numerator = 1
    denominator = 1
    for i in range(k):
        numerator = numerator * (n - i) % MODULO
        denominator = denominator * (i + 1) % MODULO
    return numerator * pow(denominator, MODULO - 2, MODULO) % MODULO


def main() -> None:
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    if n < 0 or n > 1000000:
        return

    total = binomial(2 * n, n)
    bad = binomial(2 * n, n - 1)
    print((total - bad + MODULO) % MODULO)


if __name__ == "__main__":
    main()
