{ Educational reference implementation: Pascal is not a USACO submission language. }
program IntegerGeometry;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  TInt64Array = array of Int64;

function GcdAbs(A, B: Int64): Int64;
var
  Remainder: Int64;
begin
  if A < 0 then
    A := -A;
  if B < 0 then
    B := -B;
  while B <> 0 do
  begin
    Remainder := A mod B;
    A := B;
    B := Remainder;
  end;
  GcdAbs := A;
end;

var
  N, I, J: LongInt;
  X, Y, TwiceArea, Boundary, Dx, Dy, Interior: Int64;
  Xs, Ys: TInt64Array;

begin
  N := 0;
  Read(N);
  if N < 3 then
    Exit;

  SetLength(Xs, N);
  SetLength(Ys, N);
  for I := 0 to N - 1 do
  begin
    X := 0;
    Read(X);
    Y := 0;
    Read(Y);
    Xs[I] := X;
    Ys[I] := Y;
  end;

  TwiceArea := 0;
  Boundary := 0;
  for I := 0 to N - 1 do
  begin
    J := (I + 1) mod N;
    TwiceArea := TwiceArea + Xs[I] * Ys[J] - Xs[J] * Ys[I];
    Dx := Xs[J] - Xs[I];
    Dy := Ys[J] - Ys[I];
    Boundary := Boundary + GcdAbs(Dx, Dy);
  end;

  if TwiceArea < 0 then
    TwiceArea := -TwiceArea;
  Interior := (TwiceArea - Boundary + 2) div 2;

  WriteLn(IntToStr(TwiceArea));
  WriteLn(IntToStr(Boundary));
  WriteLn(IntToStr(Interior));
end.
