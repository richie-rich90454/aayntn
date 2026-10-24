import sys

MODULO = 1000000007


def euler_phi(x: int) -> int:
    result = x
    remaining = x
    p = 2
    while p * p <= remaining:
        if remaining % p == 0:
            while remaining % p == 0:
                remaining //= p
            result -= result // p
        p += 1 if p == 2 else 2
    if remaining > 1:
        result -= result // remaining
    return result


def term(d: int, n: int, k: int) -> int:
    return euler_phi(d) * pow(k, n // d, MODULO) % MODULO


def main() -> None:
    data = sys.stdin.read().split()
    if len(data) < 2:
        return
    n = int(data[0])
    k = int(data[1])
    if n < 1 or n > 1000000 or k < 1 or k > 1000000000:
        return

    total = 0
    i = 1
    while i * i <= n:
        if n % i == 0:
            total = (total + term(i, n, k)) % MODULO
            if i != n // i:
                total = (total + term(n // i, n, k)) % MODULO
        i += 1

    print(total * pow(n, MODULO - 2, MODULO) % MODULO)


if __name__ == "__main__":
    main()
