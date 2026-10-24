import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StreamTokenizer;

public class Main {
    private static int[] childLeft;
    private static int[] childRight;
    private static int[] parent;
    private static int[] reversed;
    private static int[] stack;
    private static long[] value;
    private static long[] sum;

    private static boolean isAuxRoot(int x) {
        int p = parent[x];
        return p == 0 || (childLeft[p] != x && childRight[p] != x);
    }

    private static void pull(int x) {
        sum[x] = sum[childLeft[x]] + sum[childRight[x]] + value[x];
    }

    private static void applyReverse(int x) {
        if (x == 0) {
            return;
        }
        int swap = childLeft[x];
        childLeft[x] = childRight[x];
        childRight[x] = swap;
        reversed[x] ^= 1;
    }

    private static void push(int x) {
        if (reversed[x] == 0) {
            return;
        }
        applyReverse(childLeft[x]);
        applyReverse(childRight[x]);
        reversed[x] = 0;
    }

    private static void pushPath(int x) {
        int top = 0;
        int y = x;
        stack[top++] = y;
        while (!isAuxRoot(y)) {
            y = parent[y];
            stack[top++] = y;
        }
        while (top > 0) {
            push(stack[--top]);
        }
    }

    private static void rotate(int x) {
        int y = parent[x];
        int z = parent[y];
        boolean xIsRight = childRight[y] == x;
        int middle = xIsRight ? childLeft[x] : childRight[x];
        if (!isAuxRoot(y)) {
            if (childLeft[z] == y) {
                childLeft[z] = x;
            } else {
                childRight[z] = x;
            }
        }
        parent[x] = z;
        if (xIsRight) {
            childLeft[x] = y;
            childRight[y] = middle;
        } else {
            childRight[x] = y;
            childLeft[y] = middle;
        }
        if (middle != 0) {
            parent[middle] = y;
        }
        parent[y] = x;
        pull(y);
        pull(x);
    }

    private static void splay(int x) {
        pushPath(x);
        while (!isAuxRoot(x)) {
            int y = parent[x];
            int z = parent[y];
            if (!isAuxRoot(y)) {
                boolean xIsLeft = childLeft[y] == x;
                boolean yIsLeft = childLeft[z] == y;
                if (xIsLeft == yIsLeft) {
                    rotate(y);
                } else {
                    rotate(x);
                }
            }
            rotate(x);
        }
    }

    private static void accessPath(int x) {
        int last = 0;
        int y = x;
        while (y != 0) {
            splay(y);
            childRight[y] = last;
            pull(y);
            last = y;
            y = parent[y];
        }
        splay(x);
    }

    private static void makeRoot(int x) {
        accessPath(x);
        applyReverse(x);
    }

    private static int findRoot(int x) {
        accessPath(x);
        for (;;) {
            push(x);
            if (childLeft[x] == 0) {
                break;
            }
            x = childLeft[x];
        }
        splay(x);
        return x;
    }

    private static void link(int x, int y) {
        makeRoot(x);
        if (findRoot(y) != x) {
            parent[x] = y;
        }
    }

    private static void cut(int x, int y) {
        makeRoot(x);
        accessPath(y);
        if (childLeft[y] == x && childRight[x] == 0) {
            childLeft[y] = 0;
            parent[x] = 0;
            pull(y);
        }
    }

    private static void setValue(int x, long v) {
        accessPath(x);
        value[x] = v;
        pull(x);
    }

    private static long pathSum(int x, int y) {
        if (findRoot(x) != findRoot(y)) {
            return 0;
        }
        makeRoot(x);
        accessPath(y);
        return sum[y];
    }

    public static void main(String[] args) throws IOException {
        StreamTokenizer in =
                new StreamTokenizer(new InputStreamReader(new BufferedInputStream(System.in)));
        if (in.nextToken() == StreamTokenizer.TT_EOF) {
            return;
        }
        int n = (int) in.nval;
        if (in.nextToken() == StreamTokenizer.TT_EOF || n <= 0) {
            return;
        }
        int q = (int) in.nval;

        childLeft = new int[n + 1];
        childRight = new int[n + 1];
        parent = new int[n + 1];
        reversed = new int[n + 1];
        stack = new int[n + 1];
        value = new long[n + 1];
        sum = new long[n + 1];
        for (int v = 1; v <= n; v++) {
            value[v] = 1;
            sum[v] = 1;
        }

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < q; i++) {
            if (in.nextToken() == StreamTokenizer.TT_EOF) {
                break;
            }
            String operation = in.sval;
            in.nextToken();
            long a = (long) in.nval;
            in.nextToken();
            long b = (long) in.nval;

            if (operation.charAt(0) == 's') {
                if (a >= 0 && a < n) {
                    setValue((int) a + 1, b);
                }
                continue;
            }
            if (a < 0 || a >= n || b < 0 || b >= n) {
                if (operation.charAt(0) == 'p') {
                    out.append(0).append('\n');
                }
                continue;
            }
            int u = (int) a + 1;
            int v = (int) b + 1;
            if (operation.charAt(0) == 'l') {
                link(u, v);
            } else if (operation.charAt(0) == 'c') {
                cut(u, v);
            } else {
                out.append(pathSum(u, v)).append('\n');
            }
        }
        System.out.print(out);
    }
}
