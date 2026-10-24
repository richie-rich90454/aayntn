import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return

    q = int(data[0])
    position = 1

    value = [0] * (q + 1)
    parent = [-1] * (q + 1)
    root = [-1] * (q + 1)

    nodes = 0
    versions = 0
    output: list[str] = []

    for _ in range(q):
        kind = int(data[position])
        v = int(data[position + 1])
        position += 2

        if kind == 1:
            x = int(data[position])
            position += 1
            value[nodes] = x
            parent[nodes] = root[v]
            versions += 1
            root[versions] = nodes
            nodes += 1
        elif kind == 2:
            old = root[v]
            versions += 1
            root[versions] = -1 if old == -1 else parent[old]
        else:
            top = root[v]
            output.append(str(-1 if top == -1 else value[top]))

    if output:
        sys.stdout.write("\n".join(output))
        sys.stdout.write("\n")


if __name__ == "__main__":
    main()
