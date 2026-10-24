import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.StringTokenizer;

public class Main {
    private static final long MODULO = 1000000007L;

    private static long modPow(long base, long exponent) {
        long result = 1;
        base %= MODULO;
        while (exponent > 0) {
            if ((exponent & 1L) == 1L) {
                result = result * base % MODULO;
            }
            base = base * base % MODULO;
            exponent >>= 1;
        }
        return result;
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String line = reader.readLine();
        while (line != null && line.trim().isEmpty()) {
            line = reader.readLine();
        }
        if (line == null) {
            System.out.println(1);
            return;
        }
        StringTokenizer tokenizer = new StringTokenizer(line);
        if (!tokenizer.hasMoreTokens()) {
            System.out.println(1);
            return;
        }
        String word = tokenizer.nextToken();
        int n = word.length();

        int[] frequency = new int[26];
        for (int i = 0; i < n; ++i) {
            ++frequency[word.charAt(i) - 'a'];
        }

        long[] factorial = new long[n + 1];
        long[] inverseFactorial = new long[n + 1];
        factorial[0] = 1;
        for (int i = 1; i <= n; ++i) {
            factorial[i] = factorial[i - 1] * i % MODULO;
        }

        inverseFactorial[n] = modPow(factorial[n], MODULO - 2);
        for (int i = n; i >= 1; --i) {
            inverseFactorial[i - 1] = inverseFactorial[i] * i % MODULO;
        }

        long answer = factorial[n];
        for (int count : frequency) {
            answer = answer * inverseFactorial[count] % MODULO;
        }

        System.out.println(answer);
    }
}
