import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        if (!in.hasNextInt()) {
            return;
        }

        int n = in.nextInt();
        if (n < 0) {
            return;
        }

        long[] a = new long[n];
        for (int i = 0; i < n; i++) {
            if (!in.hasNextLong()) {
                return;
            }
            a[i] = in.nextLong();
        }

        if (!in.hasNextLong()) {
            return;
        }
        long target = in.nextLong();

        int lo = 0;
        int hi = n;
        int probes = 0;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            ++probes;
            if (a[mid] < target) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }

        System.out.println(lo + " " + probes);
    }
}
