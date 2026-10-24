import sys


def main() -> None:
    tokens = sys.stdin.buffer.read().split()
    if not tokens:
        return

    position = 0
    q = int(tokens[position])
    position += 1

    operations = []
    coordinates = []
    for _ in range(q):
        kind = int(tokens[position])
        position += 1
        if kind == 1:
            m = int(tokens[position])
            b = int(tokens[position + 1])
            position += 2
            operations.append((1, m, b))
        else:
            x = int(tokens[position])
            position += 1
            operations.append((2, x))
            coordinates.append(x)

    xs = sorted(set(coordinates))
    if not xs:
        return

    rank = {x: index for index, x in enumerate(xs)}
    k = len(xs)
    slope = [0] * (4 * k)
    intercept = [0] * (4 * k)
    used = bytearray(4 * k)

    def evaluate(m: int, b: int, x: int) -> int:
        return m * x + b

    def add_line(m: int, b: int, node: int, left: int, right: int) -> None:
        if not used[node]:
            used[node] = 1
            slope[node] = m
            intercept[node] = b
            return

        mid = left + (right - left) // 2
        better_left = evaluate(m, b, xs[left]) < evaluate(slope[node], intercept[node], xs[left])
        better_mid = evaluate(m, b, xs[mid]) < evaluate(slope[node], intercept[node], xs[mid])

        if better_mid:
            slope[node], m = m, slope[node]
            intercept[node], b = b, intercept[node]

        if left == right:
            return

        if better_left != better_mid:
            add_line(m, b, node * 2, left, mid)
        else:
            add_line(m, b, node * 2 + 1, mid + 1, right)

    def query(index: int) -> int:
        x = xs[index]
        node = 1
        left = 0
        right = k - 1
        best = None

        while True:
            if used[node]:
                value = evaluate(slope[node], intercept[node], x)
                if best is None or value < best:
                    best = value

            if left == right:
                break

            mid = left + (right - left) // 2
            if index <= mid:
                node *= 2
                right = mid
            else:
                node = node * 2 + 1
                left = mid + 1

        return best

    answers = []
    for operation in operations:
        if operation[0] == 1:
            add_line(operation[1], operation[2], 1, 0, k - 1)
        else:
            answers.append(str(query(rank[operation[1]])))

    if answers:
        sys.stdout.write("\n".join(answers) + "\n")


if __name__ == "__main__":
    main()
