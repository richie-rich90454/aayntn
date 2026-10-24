import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0:
        return

    square = n * n
    total = 0
    for k in range(1, n + 1):
        total += 2 * k - 1

    print(square)
    print(total)
    print("MATCH" if square == total else "DIFFER")


if __name__ == "__main__":
    main()
