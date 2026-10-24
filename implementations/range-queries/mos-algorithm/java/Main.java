import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Mo's algorithm over a static array, driven from standard input.
 *
 * <p>Input: n q, then n signed integers, then q pairs "l r" with
 * 1 &lt;= l &lt;= r &lt;= n. The maintained answer is the number of distinct
 * values in the current window, and the queries are answered in the order
 * they appear in the input.
 */
public final class Main {

    private Main() {
    }

    private static final class Query {
        final int left;
        final int right;
        final int id;
        final int block;

        Query(int left, int right, int id, int block) {
            this.left = left;
            this.right = right;
            this.id = id;
            this.block = block;
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        int n = (int) fs.nextLong();
        int q = (int) fs.nextLong();
        n = Math.max(0, n);
        q = Math.max(0, q);

        final int[] values = new int[n];
        final int[] sorted = new int[n];
        for (int i = 0; i < n; i++) {
            values[i] = (int) fs.nextLong();
            sorted[i] = values[i];
        }

        Arrays.sort(sorted);
        int distinctValues = 0;
        for (int i = 0; i < n; i++) {
            if (i == 0 || sorted[i] != sorted[i - 1]) {
                sorted[distinctValues] = sorted[i];
                distinctValues++;
            }
        }

        final int[] rank = new int[n];
        for (int i = 0; i < n; i++) {
            rank[i] = Arrays.binarySearch(sorted, 0, distinctValues, values[i]);
        }

        int block = 1;
        while ((long) (block + 1) * (block + 1) <= n) {
            block++;
        }

        final Query[] queries = new Query[Math.max(1, q)];
        for (int k = 0; k < q; k++) {
            final int left = (int) fs.nextLong();
            final int right = (int) fs.nextLong();
            queries[k] = new Query(left, right, k, (left - 1) / block);
        }

        Arrays.sort(queries, 0, q, new Comparator<Query>() {
            @Override
            public int compare(Query x, Query y) {
                if (x.block != y.block) {
                    return Integer.compare(x.block, y.block);
                }
                if ((x.block & 1) == 0) {
                    return Integer.compare(x.right, y.right);
                }
                return Integer.compare(y.right, x.right);
            }
        });

        final int[] frequency = new int[distinctValues];
        final int[] answers = new int[q];

        int curLeft = 1;
        int curRight = 0;
        int distinct = 0;

        for (int k = 0; k < q; k++) {
            final Query query = queries[k];

            while (curLeft > query.left) {
                curLeft--;
                final int value = rank[curLeft - 1];
                if (frequency[value] == 0) {
                    distinct++;
                }
                frequency[value]++;
            }
            while (curRight < query.right) {
                curRight++;
                final int value = rank[curRight - 1];
                if (frequency[value] == 0) {
                    distinct++;
                }
                frequency[value]++;
            }
            while (curLeft < query.left) {
                final int value = rank[curLeft - 1];
                frequency[value]--;
                if (frequency[value] == 0) {
                    distinct--;
                }
                curLeft++;
            }
            while (curRight > query.right) {
                final int value = rank[curRight - 1];
                frequency[value]--;
                if (frequency[value] == 0) {
                    distinct--;
                }
                curRight--;
            }

            answers[query.id] = distinct;
        }

        final StringBuilder output = new StringBuilder();
        final String newline = System.lineSeparator();
        for (int k = 0; k < q; k++) {
            output.append(answers[k]).append(newline);
        }
        System.out.print(output);
    }

    /**
     * Token scanner over standard input: contest inputs are far too large for
     * java.util.Scanner.
     */
    private static final class FastScanner {
        private final InputStream in = System.in;
        private final byte[] buffer = new byte[1 << 16];
        private int pointer = 0;
        private int available = 0;

        private int readByte() throws IOException {
            if (pointer == available) {
                available = in.read(buffer);
                pointer = 0;
                if (available <= 0) {
                    return -1;
                }
            }
            return buffer[pointer++];
        }

        long nextLong() throws IOException {
            int c = readByte();
            while (c != -1 && c <= ' ') {
                c = readByte();
            }
            final int sign = c == '-' ? -1 : 1;
            if (c == '-') {
                c = readByte();
            }
            long value = 0;
            while (c > ' ') {
                value = value * 10 + (c - '0');
                c = readByte();
            }
            return value * sign;
        }
    }
}
