import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    index = 0
    rows = int(data[index])
    cols = int(data[index + 1])
    index += 2

    diff = [[0] * (cols + 2) for _ in range(rows + 2)]

    for i in range(1, rows + 1):
        for j in range(1, cols + 1):
            diff[i][j] = int(data[index])
            index += 1

    for i in range(1, rows + 1):
        previous = 0
        for j in range(1, cols + 1):
            current = diff[i][j]
            diff[i][j] = current - previous
            previous = current

    for j in range(1, cols + 1):
        for i in range(rows, 1, -1):
            diff[i][j] -= diff[i - 1][j]

    queries = int(data[index])
    index += 1

    for _ in range(queries):
        r1 = int(data[index])
        c1 = int(data[index + 1])
        r2 = int(data[index + 2])
        c2 = int(data[index + 3])
        value = int(data[index + 4])
        index += 5

        diff[r1][c1] += value
        diff[r2 + 1][c1] -= value
        diff[r1][c2 + 1] -= value
        diff[r2 + 1][c2 + 1] += value

    for i in range(1, rows + 1):
        for j in range(1, cols + 1):
            diff[i][j] += diff[i - 1][j] + diff[i][j - 1] - diff[i - 1][j - 1]

    output = []
    for i in range(1, rows + 1):
        output.append(" ".join(str(diff[i][j]) for j in range(1, cols + 1)))
    sys.stdout.write("\n".join(output) + "\n")


if __name__ == "__main__":
    main()
