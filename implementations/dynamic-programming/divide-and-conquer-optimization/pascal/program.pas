{ Educational reference implementation: Pascal is not a USACO submission
  language. }
program DivideAndConquerOptimization;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  INF = 8000000000000000;

type
  TInt64Array = array of Int64;

var
  Prefix: TInt64Array;
  Previous: TInt64Array;
  Current: TInt64Array;

{ The cost of a group is the square of its sum, and the groups are contiguous,
  so dp[g][i] = min over j < i of dp[g - 1][j] + (prefix[i] - prefix[j])^2.
  The best j never moves left as i grows, so the middle entry of a range is
  solved directly and its optimal split point becomes the candidate bound of
  both halves. }
procedure SolveLayer(Left, Right, OptLeft, OptRight: Integer);
var
  Mid: Integer;
  Upper: Integer;
  BestJ: Integer;
  J: Integer;
  Difference: Int64;
  Best: Int64;
  Candidate: Int64;
begin
  if Left > Right then
    Exit;

  Mid := Left + (Right - Left) div 2;
  if OptRight < Mid - 1 then
    Upper := OptRight
  else
    Upper := Mid - 1;

  Best := INF;
  BestJ := OptLeft;
  for J := OptLeft to Upper do
  begin
    Difference := Prefix[Mid] - Prefix[J];
    Candidate := Previous[J] + Difference * Difference;
    if Candidate < Best then
    begin
      Best := Candidate;
      BestJ := J;
    end;
  end;

  Current[Mid] := Best;
  { BestJ is the optimal split point of Mid, so it bounds both halves. }
  SolveLayer(Left, Mid - 1, OptLeft, BestJ);
  SolveLayer(Mid + 1, Right, BestJ, OptRight);
end;

var
  N: Integer;
  K: Integer;
  G: Integer;
  I: Integer;
  Last: Integer;
  Value: Int64;
  TempRow: TInt64Array;
begin
  N := 0;
  Read(N);
  K := 0;
  Read(K);

  if N <= 0 then
    WriteLn('0')
  else
  begin
    if K < 1 then
      K := 1;
    if K > N then
      K := N;

    SetLength(Prefix, N + 1);
    Prefix[0] := 0;
    for I := 1 to N do
    begin
      Value := 0;
      Read(Value);
      Prefix[I] := Prefix[I - 1] + Value;
    end;

    SetLength(Previous, N + 1);
    SetLength(Current, N + 1);
    for I := 0 to N do
    begin
      Previous[I] := INF;
      Current[I] := INF;
    end;
    Previous[0] := 0;

    for G := 1 to K do
    begin
      for I := 0 to N do
        Current[I] := INF;
      { Layer G only needs prefixes that leave room for the remaining groups. }
      Last := N - K + G;
      SolveLayer(G, Last, G - 1, Last - 1);

      TempRow := Previous;
      Previous := Current;
      Current := TempRow;
    end;

    WriteLn(IntToStr(Previous[N]));
  end;
end.
