import sys

MASK = (1 << 64) - 1
BASE = 911382323


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    position = 0
    n = data[position]
    position += 1
    values = data[position : position + n]
    position += n

    prefix = [0] * (n + 1)
    power = [1] * (n + 1)
    for i in range(1, n + 1):
        prefix[i] = (prefix[i - 1] * BASE + values[i - 1]) & MASK
        power[i] = (power[i - 1] * BASE) & MASK

    q = data[position]
    position += 1
    output = []
    for _ in range(q):
        l1, r1, l2, r2 = data[position : position + 4]
        position += 4

        if r1 - l1 != r2 - l2:
            output.append("NO")
            continue

        length = r1 - l1 + 1
        first = (prefix[r1] - prefix[l1 - 1] * power[length]) & MASK
        second = (prefix[r2] - prefix[l2 - 1] * power[length]) & MASK
        output.append("YES" if first == second else "NO")

    sys.stdout.write("\n".join(output) + ("\n" if output else ""))


main()
