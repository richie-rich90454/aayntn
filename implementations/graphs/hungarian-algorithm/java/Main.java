import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    private static final long INFINITY = Long.MAX_VALUE / 4;

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder text = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            text.append(line).append(' ');
        }
        StringTokenizer tokens = new StringTokenizer(text.toString());
        if (!tokens.hasMoreTokens()) {
            return;
        }

        int n = Integer.parseInt(tokens.nextToken());
        if (n <= 0) {
            System.out.print("0\n\n");
            return;
        }

        long[][] cost = new long[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                cost[i][j] = Long.parseLong(tokens.nextToken());
            }
        }

        long[] u = new long[n + 1];
        long[] v = new long[n + 1];
        long[] minv = new long[n + 1];
        int[] p = new int[n + 1];
        int[] way = new int[n + 1];
        boolean[] used = new boolean[n + 1];

        // Row minima are feasible dual potentials for costs of either sign.
        for (int i = 1; i <= n; i++) {
            u[i] = cost[i - 1][0];
            for (int j = 1; j < n; j++) {
                if (cost[i - 1][j] < u[i]) {
                    u[i] = cost[i - 1][j];
                }
            }
        }

        for (int i = 1; i <= n; i++) {
            p[0] = i;
            int j0 = 0;
            for (int j = 0; j <= n; j++) {
                minv[j] = INFINITY;
                used[j] = false;
                way[j] = 0;
            }
            do {
                used[j0] = true;
                int i0 = p[j0];
                long delta = INFINITY;
                int j1 = 0;
                for (int j = 1; j <= n; j++) {
                    if (used[j]) {
                        continue;
                    }
                    long cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
                    if (cur < minv[j]) {
                        minv[j] = cur;
                        way[j] = j0;
                    }
                    if (minv[j] < delta) {
                        delta = minv[j];
                        j1 = j;
                    }
                }
                for (int j = 0; j <= n; j++) {
                    if (used[j]) {
                        u[p[j]] += delta;
                        v[j] -= delta;
                    } else {
                        minv[j] -= delta;
                    }
                }
                j0 = j1;
            } while (p[j0] != 0);
            do {
                int j1 = way[j0];
                p[j0] = p[j1];
                j0 = j1;
            } while (j0 != 0);
        }

        int[] assignment = new int[n];
        for (int j = 1; j <= n; j++) {
            assignment[p[j] - 1] = j - 1;
        }
        long total = 0;
        for (int i = 0; i < n; i++) {
            total += cost[i][assignment[i]];
        }

        System.out.println(total);
        StringBuilder output = new StringBuilder();
        for (int i = 0; i < n; i++) {
            if (i > 0) {
                output.append(' ');
            }
            output.append(assignment[i]);
        }
        System.out.println(output);
    }
}
