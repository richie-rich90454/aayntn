"""Top trees: link, cut, set, and path sums on a dynamically changing forest.

The reference programs use a link-cut tree rather than an explicit top tree.
Preferred paths play the role of the compress clusters and the path-parent
edges play the role of the rakes. Vertices are 0-based on the input and 1-based
inside the splay forest, so index 0 is the null node. Every vertex starts with
the value 1.
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


def access_path(x):
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
    access_path(x)
    apply_reverse(x)


def find_root(x):
    access_path(x)
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
    access_path(y)
    if child_left[y] == x and child_right[x] == 0:
        child_left[y] = 0
        parent[x] = 0
        pull(y)


def set_value(x, v):
    access_path(x)
    value[x] = v
    pull(x)


def path_sum(x, y):
    if find_root(x) != find_root(y):
        return 0
    make_root(x)
    access_path(y)
    return total[y]


def main():
    global child_left, child_right, parent, reversed_flag, stack, value, total
    data = sys.stdin.buffer.read().split()
    if len(data) < 2:
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
    value = [0] + [1] * n
    total = [0] + [1] * n

    index = 2
    out = []
    for _ in range(q):
        operation = data[index]
        a = int(data[index + 1])
        b = int(data[index + 2])
        index += 3
        if operation == b"set":
            if 0 <= a < n:
                set_value(a + 1, b)
        elif not (0 <= a < n and 0 <= b < n):
            if operation == b"path":
                out.append("0")
        elif operation == b"link":
            link(a + 1, b + 1)
        elif operation == b"cut":
            cut(a + 1, b + 1)
        else:
            out.append(str(path_sum(a + 1, b + 1)))
    text = "\n".join(out)
    if text:
        text += "\n"
    sys.stdout.buffer.write(text.encode())


if __name__ == "__main__":
    main()
