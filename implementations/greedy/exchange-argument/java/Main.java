import java.util.Arrays;
import java.util.Scanner;

public class Main {
    private static final class Interval implements Comparable<Interval> {
        final long start;
        final long end;

        Interval(long start, long end) {
            this.start = start;
            this.end = end;
        }

        @Override
        public int compareTo(Interval other) {
            if (end != other.end) {
                return Long.compare(end, other.end);
            }
            return Long.compare(start, other.start);
        }
    }

    private static boolean compatible(Interval a, Interval b) {
        return a.end <= b.start || b.end <= a.start;
    }

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextInt()) {
            return;
        }
        int n = scanner.nextInt();
        if (n < 0 || n > 12) {
            return;
        }

        Interval[] intervals = new Interval[n];
        for (int i = 0; i < n; ++i) {
            long start = scanner.nextLong();
            long end = scanner.nextLong();
            intervals[i] = new Interval(start, end);
        }
        scanner.close();

        Interval[] sorted = intervals.clone();
        Arrays.sort(sorted);

        int greedy = 0;
        long freeTime = Long.MIN_VALUE / 4;
        for (Interval interval : sorted) {
            if (interval.start >= freeTime) {
                ++greedy;
                freeTime = interval.end;
            }
        }

        int best = 0;
        for (int mask = 0; mask < (1 << n); ++mask) {
            int count = 0;
            boolean ok = true;
            for (int left = 0; left < n && ok; ++left) {
                if ((mask & (1 << left)) == 0) {
                    continue;
                }
                ++count;
                for (int right = left + 1; right < n; ++right) {
                    if ((mask & (1 << right)) != 0
                            && !compatible(intervals[left], intervals[right])) {
                        ok = false;
                        break;
                    }
                }
            }
            if (ok && count > best) {
                best = count;
            }
        }

        System.out.println(greedy + " " + best);
        System.out.println(greedy == best ? "MATCH" : "DIFFER");
    }
}
