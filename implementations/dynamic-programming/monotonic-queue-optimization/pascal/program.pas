{ Educational reference implementation: Pascal is not a USACO submission language. }
program MonotonicQueueProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  N: LongInt;
  K: LongInt;
  I: LongInt;
  Head: LongInt;
  Tail: LongInt;
  Kept: LongInt;
  Value: Int64;
  Dp: array of Int64;
  Deque: array of LongInt;
begin
  N := 0;
  Read(N);
  K := 1;
  Read(K);
  if N < 0 then
    N := 0;
  if K < 1 then
    K := 1;

  SetLength(Dp, N + 1);
  SetLength(Deque, N + 1);

  { The deque holds indices with strictly increasing Dp values. Its front is
    the cheapest candidate inside the current window. }
  Dp[0] := 0;
  Head := 0;
  Tail := 0;
  Deque[Tail] := 0;
  Tail := Tail + 1;
  Kept := 0;

  for I := 1 to N do
  begin
    Value := 0;
    Read(Value);

    { The window is [I - K, I - 1], so an index is stale only when it is
      strictly smaller than I - K. }
    while (Head < Tail) and (Deque[Head] < I - K) do
      Head := Head + 1;

    Dp[I] := Value + Dp[Deque[Head]];

    { An older index with a value no smaller than Dp[I] can never be the
      minimum again: I expires later and is at least as cheap. }
    while (Head < Tail) and (Dp[Deque[Tail - 1]] >= Dp[I]) do
      Tail := Tail - 1;
    Deque[Tail] := I;
    Tail := Tail + 1;
    Kept := I;
  end;

  WriteLn(IntToStr(Dp[Kept]));
end.
