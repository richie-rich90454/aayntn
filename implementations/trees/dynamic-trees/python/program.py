"""Dynamic trees (link-cut trees): link, cut, and path sums on a forest.

The vertices are 0-based on the input and 1-based inside the splay forest, so
index 0 is the null node. Vertex v carries the value v + 1, which makes the
answer the sum of the labels of the vertices on the path.
"""

import sys

child_left = []
child_right = []
parent = []
reversed_flag = []
stack = []
value = []
total = []


def is_aux_root(x):
    p = parent[x]
    return p == 0 or (child_left[p] != x and child_right[p] != x)


def pull(x):
    total[x] = total[child_left[x]] + total[child_right[x]] + value[x]


def apply_reverse(x):
    if x == 0:
        return
    child_left[x], child_right[x] = child_right[x], child_left[x]
    reversed_flag[x] ^= 1


def push(x):
    if reversed_flag[x]:
        apply_reverse(child_left[x])
        apply_reverse(child_right[x])
        reversed_flag[x] = 0


def push_path(x):
    stack.clear()
    y = x
    stack.append(y)
    while not is_aux_root(y):
        y = parent[y]
        stack.append(y)
    while stack:
        push(stack.pop())


def rotate(x):
    y = parent[x]
    z = parent[y]
    x_is_right = child_right[y] == x
    middle = child_left[x] if x_is_right else child_right[x]
    if not is_aux_root(y):
        if child_left[z] == y:
            child_left[z] = x
        else:
            child_right[z] = x
    parent[x] = z
    if x_is_right:
        child_left[x] = y
        child_right[y] = middle
    else:
        child_right[x] = y
        child_left[y] = middle
    if middle:
        parent[middle] = y
    parent[y] = x
    pull(y)
    pull(x)


def splay(x):
    push_path(x)
    while not is_aux_root(x):
        y = parent[x]
        z = parent[y]
        if not is_aux_root(y):
            if (child_left[y] == x) == (child_left[z] == y):
                rotate(y)
            else:
                rotate(x)
        rotate(x)


def expose(x):
    last = 0
    y = x
    while y:
        splay(y)
        child_right[y] = last
        pull(y)
        last = y
        y = parent[y]
    splay(x)


def make_root(x):
    expose(x)
    apply_reverse(x)


def find_root(x):
    expose(x)
    while True:
        push(x)
        if child_left[x] == 0:
            break
        x = child_left[x]
    splay(x)
    return x


def link(x, y):
    make_root(x)
    if find_root(y) != x:
        parent[x] = y


def cut(x, y):
    make_root(x)
    expose(y)
    if child_left[y] == x and child_right[x] == 0:
        child_left[y] = 0
        parent[x] = 0
        pull(y)


def path_sum(x, y):
    make_root(x)
    expose(y)
    return total[y]


def main():
    global child_left, child_right, parent, reversed_flag, stack, value, total
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    n = int(data[0])
    q = int(data[1])
    if n <= 0:
        return
    child_left = [0] * (n + 1)
    child_right = [0] * (n + 1)
    parent = [0] * (n + 1)
    reversed_flag = [0] * (n + 1)
    stack = []
    value = [0] + list(range(1, n + 1))
    total = [0] + list(range(1, n + 1))

    index = 2
    out = []
    for _ in range(q):
        operation = data[index]
        u = int(data[index + 1]) + 1
        v = int(data[index + 2]) + 1
        index += 3
        if operation == b"link":
            link(u, v)
        elif operation == b"cut":
            cut(u, v)
        else:
            out.append(str(path_sum(u, v)))
    text = "\n".join(out)
    if text:
        text += "\n"
    sys.stdout.buffer.write(text.encode())


if __name__ == "__main__":
    main()
