import sys


def main() -> None:
    tokens = sys.stdin.buffer.read().split()
    if len(tokens) < 2:
        return

    index = 0
    n = int(tokens[index])
    index += 1
    q = int(tokens[index])
    index += 1

    parent = list(range(n + 1))
    size = [1] * (n + 1)
    history: list[tuple[int, int, int]] = []

    def find(v: int) -> int:
        while parent[v] != v:
            v = parent[v]
        return v

    def unite(a: int, b: int) -> None:
        ra = find(a)
        rb = find(b)
        if ra == rb:
            history.append((0, 0, 0))
            return
        if size[ra] < size[rb]:
            ra, rb = rb, ra
        history.append((rb, ra, size[ra]))
        parent[rb] = ra
        size[ra] += size[rb]

    def rollback() -> None:
        if not history:
            return
        child, root, old_size = history.pop()
        if child == 0:
            return
        parent[child] = child
        size[root] = old_size

    output: list[str] = []
    for _ in range(q):
        if index >= len(tokens):
            break
        command = tokens[index]
        index += 1
        if command == b"union":
            u = int(tokens[index])
            v = int(tokens[index + 1])
            index += 2
            unite(u, v)
        elif command == b"rollback":
            rollback()
        else:
            u = int(tokens[index])
            v = int(tokens[index + 1])
            index += 2
            output.append("YES" if find(u) == find(v) else "NO")

    if output:
        sys.stdout.write("\n".join(output) + "\n")


if __name__ == "__main__":
    main()
