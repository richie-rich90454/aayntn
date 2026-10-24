import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/*
 * An implicit segment tree over [1, m]. Nodes are created only along update
 * paths, so the untouched parts of a domain as large as 10^9 stay absent and
 * contribute zero to every query.
 */
public class Main {
    private static int[] left;
    private static int[] right;
    private static long[] sum;
    private static int used;

    /* Node 0 is the null node, so its sum stays zero and its children are unused. */
    private static int newNode() {
        int index = used++;
        left[index] = 0;
        right[index] = 0;
        sum[index] = 0;
        return index;
    }

    private static void add(int root, int lo, int hi, int pos, long delta) {
        sum[root] += delta;
        if (lo == hi) {
            return;
        }
        int mid = lo + (hi - lo) / 2;
        if (pos <= mid) {
            if (left[root] == 0) {
                left[root] = newNode();
            }
            add(left[root], lo, mid, pos, delta);
        } else {
            if (right[root] == 0) {
                right[root] = newNode();
            }
            add(right[root], mid + 1, hi, pos, delta);
        }
    }

    private static long query(int root, int lo, int hi, int ql, int qr) {
        if (root == 0 || qr < lo || hi < ql) {
            return 0;
        }
        if (ql <= lo && hi <= qr) {
            return sum[root];
        }
        int mid = lo + (hi - lo) / 2;
        long total = 0;
        if (ql <= mid) {
            total += query(left[root], lo, mid, ql, qr);
        }
        if (qr > mid) {
            total += query(right[root], mid + 1, hi, ql, qr);
        }
        return total;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder text = new StringBuilder();
        char[] buffer = new char[1 << 16];
        int count;
        while ((count = reader.read(buffer)) != -1) {
            text.append(buffer, 0, count);
        }

        StringTokenizer tokenizer = new StringTokenizer(text.toString());
        if (!tokenizer.hasMoreTokens()) {
            return;
        }
        int m = Integer.parseInt(tokenizer.nextToken());
        int q = tokenizer.hasMoreTokens() ? Integer.parseInt(tokenizer.nextToken()) : 0;
        if (m < 1 || q < 0) {
            return;
        }

        int bits = 0;
        long size = 1;
        while (size < m) {
            size <<= 1;
            ++bits;
        }
        int capacity = 2 + q * (bits + 1);
        left = new int[capacity];
        right = new int[capacity];
        sum = new long[capacity];
        used = 1;
        newNode();

        StringBuilder output = new StringBuilder();
        for (int k = 0; k < q && tokenizer.hasMoreTokens(); ++k) {
            int kind = Integer.parseInt(tokenizer.nextToken());
            if (kind == 1) {
                int pos = Integer.parseInt(tokenizer.nextToken());
                long delta = Long.parseLong(tokenizer.nextToken());
                add(1, 1, m, pos, delta);
            } else if (kind == 2) {
                int l = Integer.parseInt(tokenizer.nextToken());
                int r = Integer.parseInt(tokenizer.nextToken());
                output.append(query(1, 1, m, l, r)).append('\n');
            } else {
                break;
            }
        }
        System.out.print(output);
    }
}
