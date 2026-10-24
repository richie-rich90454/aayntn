import sys


def main() -> None:
    data = sys.stdin.read().split()
    if not data:
        return

    n = int(data[0])
    if n < 0:
        n = 0

    copies = 0
    capacity = 1
    while capacity < n:
        copies += capacity
        capacity *= 2

    print(copies, capacity)


if __name__ == "__main__":
    main()
