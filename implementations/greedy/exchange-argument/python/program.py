import sys


def main() -> None:
    data = list(map(int, sys.stdin.buffer.read().split()))
    if not data:
        return

    n = data[0]
    if n < 0 or n > 12:
        return

    intervals = [(data[1 + 2 * i], data[2 + 2 * i]) for i in range(n)]

    greedy = 0
    free_time = -(10**30)
    for start, end in sorted(intervals, key=lambda item: (item[1], item[0])):
        if start >= free_time:
            greedy += 1
            free_time = end

    best = 0
    for mask in range(1 << n):
        chosen = [intervals[i] for i in range(n) if (mask >> i) & 1]
        ok = True
        for i in range(len(chosen)):
            for j in range(i + 1, len(chosen)):
                if not (chosen[i][1] <= chosen[j][0] or chosen[j][1] <= chosen[i][0]):
                    ok = False
                    break
            if not ok:
                break
        if ok and len(chosen) > best:
            best = len(chosen)

    print(greedy, best)
    print("MATCH" if greedy == best else "DIFFER")


if __name__ == "__main__":
    main()
