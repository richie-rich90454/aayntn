/*
 * aayntn: the general-purpose C++17 contest template.
 *
 * Two forms are published. This one uses the GNU convenience header, which is
 * available on every compiler a contest uses but is not part of standard
 * C++17. The standards-compliant form is in standard.cpp.
 *
 * The synchronization with the standard streams is turned off, which matters
 * only for code that uses those streams consistently; the newline character
 * is used instead of the manipulator because the manipulator flushes.
 */
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    // The algorithm goes here.

    cout << n << '\n';
    return 0;
}
