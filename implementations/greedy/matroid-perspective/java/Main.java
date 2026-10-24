import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Reads n pairs of color and weight, then prints the maximum total weight of a
 * set that contains at most one item of each color.
 *
 * <p>Input: n, then n lines each holding a color and a weight.
 * Output: one line holding the total.
 */
public final class Main {

    private Main() {
    }

    private static final class Item {
        private final long color;
        private final long weight;

        private Item(long color, long weight) {
            this.color = color;
            this.weight = weight;
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner scanner = new FastScanner();
        final int n = (int) scanner.nextLong();

        if (n <= 0) {
            System.out.println(0);
            return;
        }

        final Item[] items = new Item[n];
        for (int i = 0; i < n; i++) {
            items[i] = new Item(scanner.nextLong(), scanner.nextLong());
        }

        Arrays.sort(items, new Comparator<Item>() {
            @Override
            public int compare(Item a, Item b) {
                if (a.color != b.color) {
                    return Long.compare(a.color, b.color);
                }
                return Long.compare(b.weight, a.weight);
            }
        });

        long total = 0;
        boolean first = true;
        long previous = 0;
        for (Item item : items) {
            if (first || item.color != previous) {
                total += item.weight;
                previous = item.color;
                first = false;
            }
        }

        System.out.println(total);
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
