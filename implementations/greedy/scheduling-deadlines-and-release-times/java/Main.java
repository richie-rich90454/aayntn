import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.PriorityQueue;

/**
 * Reads unit-time jobs with deadlines and profits, and prints the maximum total
 * profit of a set that can all finish by their deadlines.
 *
 * <p>Input: n, then n lines holding the deadline and the profit of one job.
 * Output: one line holding the maximum total profit.
 */
public final class Main {

    private Main() {
    }

    /** One job: it takes one unit of time and must finish by its deadline. */
    private static final class Job {
        private final long deadline;
        private final long profit;

        private Job(long deadline, long profit) {
            this.deadline = deadline;
            this.profit = profit;
        }
    }

    public static void main(String[] args) throws IOException {
        final FastScanner fs = new FastScanner();
        final int n = (int) fs.nextLong();

        if (n <= 0) {
            System.out.println(0);
            return;
        }

        final Job[] jobs = new Job[n];
        for (int i = 0; i < n; i++) {
            final long deadline = fs.nextLong();
            final long profit = fs.nextLong();
            jobs[i] = new Job(deadline, profit);
        }

        Arrays.sort(jobs, (x, y) -> Long.compare(x.deadline, y.deadline));

        final PriorityQueue<Long> selected = new PriorityQueue<>();
        for (Job job : jobs) {
            selected.add(job.profit);
            if ((long) selected.size() > job.deadline) {
                selected.poll();
            }
        }

        long total = 0;
        for (long profit : selected) {
            total += profit;
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
