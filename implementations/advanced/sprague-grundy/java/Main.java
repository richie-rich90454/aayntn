import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

/**
 * Reads a set of allowed moves and a list of heap sizes, tabulates the Grundy
 * value of one heap, prints the value of every heap, and reports whether the
 * combined position is a win for the first player.
 */
public final class Main {
    private Main() {
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        StringBuilder input = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            input.append(line).append(' ');
        }

        StringTokenizer tokens = new StringTokenizer(input.toString());
        if (!tokens.hasMoreTokens()) {
            return;
        }

        int k = Math.max(0, Integer.parseInt(tokens.nextToken()));
        int[] moves = new int[k];
        for (int i = 0; i < k; ++i) {
            if (!tokens.hasMoreTokens()) {
                return;
            }
            moves[i] = Integer.parseInt(tokens.nextToken());
        }

        if (!tokens.hasMoreTokens()) {
            return;
        }
        int h = Math.max(0, Integer.parseInt(tokens.nextToken()));
        int[] heaps = new int[h];
        int maxHeap = 0;
        for (int i = 0; i < h; ++i) {
            if (!tokens.hasMoreTokens()) {
                return;
            }
            heaps[i] = Integer.parseInt(tokens.nextToken());
            maxHeap = Math.max(maxHeap, heaps[i]);
        }

        int[] grundy = new int[maxHeap + 1];
        int[] seen = new int[k + 2];

        for (int s = 1; s <= maxHeap; ++s) {
            for (int move : moves) {
                if (move <= s) {
                    // The stamp s marks a value reachable from this size.
                    seen[grundy[s - move]] = s;
                }
            }
            int g = 0;
            while (g <= k && seen[g] == s) {
                ++g;
            }
            grundy[s] = g;
        }

        StringBuilder output = new StringBuilder();
        int total = 0;
        for (int size : heaps) {
            int g = grundy[size];
            output.append(g).append('\n');
            total ^= g;
        }
        output.append(total != 0 ? "first" : "second").append('\n');
        System.out.print(output);
    }
}
