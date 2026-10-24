program KnuthOptimization;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

{ Matrix chain multiplication with the monotone split window.

  Input: n, then n + 1 dimensions p[0] .. p[n]. Matrix i has dimensions
  p[i] by p[i + 1], for 0 <= i < n.
  Output: the minimum number of scalar multiplications.

  The split for a range [i, j] is only searched in
  [opt[i][j - 1], opt[i + 1][j]]. That bound is what turns the cubic
  interval table into a quadratic one. }

type
  TInt64Matrix = array of array of Int64;
  TIntMatrix = array of array of Integer;

var
  N: Integer;
  I: Integer;
  J: Integer;
  K: Integer;
  Len: Integer;
  Lo: Integer;
  Hi: Integer;
  BestK: Integer;
  Best: Int64;
  Cost: Int64;
  P: array of Int64;
  Dp: TInt64Matrix;
  Opt: TIntMatrix;

begin
  N := 0;
  Read(N);

  if N <= 0 then
    WriteLn('0')
  else
  begin
    SetLength(P, N + 1);
    for I := 0 to N do
    begin
      P[I] := 1;
      Read(P[I]);
    end;

    SetLength(Dp, N);
    SetLength(Opt, N);
    for I := 0 to N - 1 do
    begin
      SetLength(Dp[I], N);
      SetLength(Opt[I], N);
      Opt[I][I] := I;
    end;

    for Len := 2 to N do
    begin
      for I := 0 to N - Len do
      begin
        J := I + Len - 1;
        Lo := Opt[I][J - 1];
        Hi := Opt[I + 1][J];
        if Lo < I then
          Lo := I;
        if Hi > J - 1 then
          Hi := J - 1;
        if Lo > Hi then
        begin
          Lo := I;
          Hi := J - 1;
        end;

        Best := -1;
        BestK := Lo;
        for K := Lo to Hi do
        begin
          Cost := Dp[I][K] + Dp[K + 1][J] + P[I] * P[K + 1] * P[J + 1];
          if (Best < 0) or (Cost < Best) then
          begin
            Best := Cost;
            BestK := K;
          end;
        end;

        Dp[I][J] := Best;
        Opt[I][J] := BestK;
      end;
    end;

    WriteLn(IntToStr(Dp[0][N - 1]));
  end;
end.
