import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Reads records of three integer keys, sorts them by a ascending, then b
 * descending, then c ascending, and prints the sorted records.
 *
 * <p>Input: n, then n lines holding a, b and c.
 * Output: one line per record, with the three fields separated by single
 * spaces.
 */
public final class Main {

    private Main() {
    }

    /** One record of three integer keys. */
    private static final class Record {
        private final int a;
        private final int b;
        private final int c;

        private Record(int a, int b, int c) {
            this.a = a;
            this.b = b;
            this.c = c;
        }
    }

    /**
     * The required order: a ascending, then b descending, then c ascending.
     * Integer.compare is used rather than subtraction, so no difference can
     * overflow, and the comparator returns zero only when all keys agree.
     */
    private static final Comparator<Record> ORDER = (x, y) -> {
        if (x.a != y.a) {
            return Integer.compare(x.a, y.a);
        }
        if (x.b != y.b) {
            return Integer.compare(y.b, x.b);
        }
        return Integer.compare(x.c, y.c);
    };

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = Math.max(0, (int) fs.nextLong());
        final Record[] records = new Record[n];

        for (int i = 0; i < n; i++) {
            final int a = (int) fs.nextLong();
            final int b = (int) fs.nextLong();
            final int c = (int) fs.nextLong();
            records[i] = new Record(a, b, c);
        }

        Arrays.sort(records, ORDER);

        final StringBuilder out = new StringBuilder();
        for (Record r : records) {
            out.append(r.a).append(' ').append(r.b).append(' ').append(r.c).append('\n');
        }
        System.out.print(out);
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
            int sign = 1;
            if (c == '-') {
                sign = -1;
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
