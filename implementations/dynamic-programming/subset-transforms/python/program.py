import sys

MOD = 1000000007


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    if n < 0 or n > 24:
        return

    total = 1 << n
    g = data[1 : 1 + total]
    if len(g) < total:
        g.extend([0] * (total - len(g)))

    step = 1
    for _ in range(n):
        for base in range(0, total, step << 1):
            for off in range(step):
                target = base + step + off
                g[target] = (g[target] + g[base + off]) % MOD
        step <<= 1

    sys.stdout.write(" ".join(map(str, g)) + "\n")


main()
