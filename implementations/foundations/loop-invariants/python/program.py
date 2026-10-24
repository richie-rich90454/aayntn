import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0 or len(data) < n + 2:
        return

    a = [int(value) for value in data[1 : 1 + n]]
    target = int(data[n + 1])

    lo = 0
    hi = n
    probes = 0
    while lo < hi:
        mid = lo + (hi - lo) // 2
        probes += 1
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid

    print(lo, probes)


if __name__ == "__main__":
    main()
