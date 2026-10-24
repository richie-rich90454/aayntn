import java.util.Scanner;

/*
 * Longest substring with at most k distinct characters.
 *
 * The window is the longest mode of the state machine: push the next byte,
 * shrink while the distinct count is too large, then record the length.
 */

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        if (!scanner.hasNext()) {
            System.out.println(0);
            return;
        }

        String s = scanner.next();
        int k = scanner.hasNextInt() ? scanner.nextInt() : 0;

        if (k < 0) {
            k = 0;
        }

        int[] count = new int[256];
        int left = 0;
        int distinct = 0;
        int best = 0;

        for (int right = 0; right < s.length(); ++right) {
            char in = s.charAt(right);

            if (count[in] == 0) {
                ++distinct;
            }
            ++count[in];

            while (distinct > k) {
                char out = s.charAt(left);

                --count[out];
                if (count[out] == 0) {
                    --distinct;
                }
                ++left;
            }

            best = Math.max(best, right - left + 1);
        }

        System.out.println(best);
    }
}
