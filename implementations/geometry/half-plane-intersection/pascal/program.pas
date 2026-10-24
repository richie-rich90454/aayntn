{ Educational reference implementation: Pascal is not a USACO submission language. }
program HalfPlaneProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

type
  { A half-plane a*x + b*y <= c is a directed line together with the side on
    which it is feasible. The feasible region is the intersection of all the
    half-planes. The polygon is kept in the dual form: a cyclic list of the
    lines that support its edges, so the vertex between two consecutive lines
    is their intersection and no coordinate is stored until the area is
    printed. }
  TLine = record
    A, B, C: Int64;
  end;

var
  Planes: array of TLine;
  Lines: array of TLine;
  Poly: array of Integer;
  NextPoly: array of Integer;
  Ins: array of Boolean;

function Gcd64(A, B: Int64): Int64;
var
  T: Int64;
begin
  if A < 0 then
    A := -A;
  if B < 0 then
    B := -B;
  while B <> 0 do
  begin
    T := A mod B;
    A := B;
    B := T;
  end;
  Result := A;
end;

{ Whether the intersection of U and V lies in the closed half-plane H. With
  W = det(U, V), x = X/W and y = Y/W, the value of H at that point has the
  sign of (H.A*X + H.B*Y - H.C*W) multiplied by the sign of W. }
function Inside(const U, V, H: TLine): Boolean;
var
  W, X, Y, Numerator: Int64;
begin
  W := U.A * V.B - V.A * U.B;
  if W = 0 then
  begin
    Result := True;
    Exit;
  end;
  X := U.C * V.B - V.C * U.B;
  Y := U.A * V.C - V.A * U.C;
  Numerator := H.A * X + H.B * Y - H.C * W;
  if W > 0 then
    Result := Numerator <= 0
  else
    Result := Numerator >= 0;
end;

{ The intersection of U and V as the reduced homogeneous point (X/W, Y/W). }
function Intersect(const U, V: TLine; out X, Y, W: Int64): Boolean;
var
  Divisor: Int64;
begin
  W := U.A * V.B - V.A * U.B;
  X := U.C * V.B - V.C * U.B;
  Y := U.A * V.C - V.A * U.C;
  if W = 0 then
  begin
    Result := False;
    Exit;
  end;
  Divisor := Gcd64(Gcd64(X, Y), W);
  X := X div Divisor;
  Y := Y div Divisor;
  W := W div Divisor;
  if W < 0 then
  begin
    X := -X;
    Y := -Y;
    W := -W;
  end;
  Result := True;
end;

var
  N, I, J, K, Count, H, NextJ, Direction: Integer;
  MaxA, MaxC, M, LineCount, PolyCount: Int64;
  AnyInside, HasNormal, Unbounded, Feasible, Found: Boolean;
  DX, DY, Num, Den, Term, Scale, Divisor: Int64;
  VX, VY, VW: array of Int64;
  U, V: TLine;
  PointX, PointY, PointW: Int64;

begin
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;
  SetLength(Planes, N);
  MaxA := 1;
  MaxC := 0;
  for I := 0 to N - 1 do
  begin
    Read(Planes[I].A);
    Read(Planes[I].B);
    Read(Planes[I].C);
    if Abs(Planes[I].A) > MaxA then
      MaxA := Abs(Planes[I].A);
    if Abs(Planes[I].B) > MaxA then
      MaxA := Abs(Planes[I].B);
    if Abs(Planes[I].C) > MaxC then
      MaxC := Abs(Planes[I].C);
  end;

  { Every vertex of a bounded region is the intersection of two input lines,
    so its coordinates are at most 2*MaxA*MaxC in absolute value. The box is
    larger than every such vertex. }
  M := 2 * MaxA * MaxC + 2;

  SetLength(Lines, N + 8);
  Lines[0].A := 0;
  Lines[0].B := -1;
  Lines[0].C := M;
  Lines[1].A := 1;
  Lines[1].B := 0;
  Lines[1].C := M;
  Lines[2].A := 0;
  Lines[2].B := 1;
  Lines[2].C := M;
  Lines[3].A := -1;
  Lines[3].B := 0;
  Lines[3].C := M;
  LineCount := 4;

  SetLength(Poly, N + 8);
  SetLength(NextPoly, N + 8);
  Poly[0] := 0;
  Poly[1] := 1;
  Poly[2] := 2;
  Poly[3] := 3;
  PolyCount := 4;

  for I := 0 to N - 1 do
  begin
    H := LineCount;
    Lines[H] := Planes[I];
    LineCount := LineCount + 1;

    K := PolyCount;
    SetLength(Ins, K);
    AnyInside := False;
    for J := 0 to K - 1 do
    begin
      NextJ := (J + 1) mod K;
      Ins[J] := Inside(Lines[Poly[J]], Lines[Poly[NextJ]], Lines[H]);
      if Ins[J] then
        AnyInside := True;
    end;
    if not AnyInside then
    begin
      PolyCount := 0;
      Continue;
    end;

    Count := 0;
    for J := 0 to K - 1 do
    begin
      NextJ := (J + 1) mod K;
      if Ins[J] or Ins[NextJ] then
      begin
        NextPoly[Count] := Poly[NextJ];
        Count := Count + 1;
      end;
      if Ins[J] and (not Ins[NextJ]) then
      begin
        NextPoly[Count] := H;
        Count := Count + 1;
      end;
    end;
    for J := 0 to Count - 1 do
      Poly[J] := NextPoly[J];
    PolyCount := Count;
  end;

  if PolyCount = 0 then
  begin
    WriteLn('0');
    Exit;
  end;

  { The region is unbounded exactly when some nonzero direction d satisfies
    a*d.x + b*d.y <= 0 for every constraint. An extreme ray of that cone is
    parallel to one of the constraint lines, so testing both directions of
    every line is enough. }
  HasNormal := False;
  for I := 0 to N - 1 do
    if (Planes[I].A <> 0) or (Planes[I].B <> 0) then
      HasNormal := True;
  if not HasNormal then
  begin
    WriteLn('UNBOUNDED');
    Exit;
  end;

  Unbounded := False;
  for I := 0 to N - 1 do
  begin
    if Unbounded then
      Break;
    if (Planes[I].A = 0) and (Planes[I].B = 0) then
      Continue;
    for Direction := 0 to 1 do
    begin
      if Direction = 0 then
      begin
        DX := -Planes[I].B;
        DY := Planes[I].A;
      end
      else
      begin
        DX := Planes[I].B;
        DY := -Planes[I].A;
      end;
      Feasible := True;
      for J := 0 to N - 1 do
        if Planes[J].A * DX + Planes[J].B * DY > 0 then
        begin
          Feasible := False;
          Break;
        end;
      if Feasible then
      begin
        Unbounded := True;
        Break;
      end;
    end;
  end;
  if Unbounded then
  begin
    WriteLn('UNBOUNDED');
    Exit;
  end;

  if PolyCount < 3 then
  begin
    WriteLn('0');
    Exit;
  end;

  SetLength(VX, PolyCount);
  SetLength(VY, PolyCount);
  SetLength(VW, PolyCount);
  for I := 0 to PolyCount - 1 do
  begin
    J := (I + 1) mod PolyCount;
    U := Lines[Poly[I]];
    V := Lines[Poly[J]];
    Found := Intersect(U, V, PointX, PointY, PointW);
    if not Found then
    begin
      WriteLn('0');
      Exit;
    end;
    VX[I] := PointX;
    VY[I] := PointY;
    VW[I] := PointW;
  end;

  Num := 0;
  Den := 1;
  for I := 0 to PolyCount - 1 do
  begin
    J := (I + 1) mod PolyCount;
    Term := VX[I] * VY[J] - VY[I] * VX[J];
    Scale := VW[I] * VW[J];
    if Scale < 0 then
    begin
      Term := -Term;
      Scale := -Scale;
    end;
    Divisor := Gcd64(Term, Scale);
    Term := Term div Divisor;
    Scale := Scale div Divisor;
    Num := Num * Scale + Term * Den;
    Den := Den * Scale;
    Divisor := Gcd64(Num, Den);
    Num := Num div Divisor;
    Den := Den div Divisor;
  end;
  if Num < 0 then
    Num := -Num;

  if Den = 1 then
    WriteLn(IntToStr(Num))
  else
    WriteLn(IntToStr(Num) + '/' + IntToStr(Den));
end.
