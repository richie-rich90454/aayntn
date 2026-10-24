{ Educational reference implementation: Pascal is not a USACO submission language. }
program KDTreeProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TPoint = record
    X: Int64;
    Y: Int64;
  end;

var
  N, Q, I, Root: LongInt;
  Pts: array of TPoint;
  Order: array of LongInt;
  Tmp: array of LongInt;
  LeftChild: array of LongInt;
  RightChild: array of LongInt;
  BestDist: Int64;
  BestIndex: LongInt;

function Dist2(A, B: TPoint): Int64;
var
  DX, DY: Int64;
begin
  DX := A.X - B.X;
  DY := A.Y - B.Y;
  Result := DX * DX + DY * DY;
end;

function DistTo(Index: LongInt; QX, QY: Int64): Int64;
var
  DX, DY: Int64;
begin
  DX := Pts[Index].X - QX;
  DY := Pts[Index].Y - QY;
  Result := DX * DX + DY * DY;
end;

function LessIndex(A, B, Axis: LongInt): Boolean;
var
  VA, VB: Int64;
begin
  if Axis = 0 then
  begin
    VA := Pts[A].X;
    VB := Pts[B].X;
  end
  else
  begin
    VA := Pts[A].Y;
    VB := Pts[B].Y;
  end;
  if VA <> VB then
    Result := VA < VB
  else
    Result := A < B;
end;

procedure SortRange(Lo, Hi, Axis: LongInt);
var
  Mid, I, J, K: LongInt;
begin
  if Lo >= Hi then
    Exit;
  Mid := (Lo + Hi) div 2;
  SortRange(Lo, Mid, Axis);
  SortRange(Mid + 1, Hi, Axis);
  I := Lo;
  J := Mid + 1;
  K := Lo;
  while (I <= Mid) and (J <= Hi) do
  begin
    if LessIndex(Order[I], Order[J], Axis) then
    begin
      Tmp[K] := Order[I];
      Inc(I);
    end
    else
    begin
      Tmp[K] := Order[J];
      Inc(J);
    end;
    Inc(K);
  end;
  while I <= Mid do
  begin
    Tmp[K] := Order[I];
    Inc(I);
    Inc(K);
  end;
  while J <= Hi do
  begin
    Tmp[K] := Order[J];
    Inc(J);
    Inc(K);
  end;
  for I := Lo to Hi do
    Order[I] := Tmp[I];
end;

function Build(Lo, Hi, Depth: LongInt): LongInt;
var
  Axis, Mid, Node: LongInt;
begin
  if Lo >= Hi then
  begin
    Result := -1;
    Exit;
  end;
  Axis := Depth mod 2;
  SortRange(Lo, Hi - 1, Axis);
  Mid := Lo + (Hi - Lo) div 2;
  Node := Order[Mid];
  LeftChild[Node] := Build(Lo, Mid, Depth + 1);
  RightChild[Node] := Build(Mid + 1, Hi, Depth + 1);
  Result := Node;
end;

procedure Nearest(Node: LongInt; QX, QY: Int64; Depth: LongInt);
var
  D, Delta: Int64;
  Axis, NearChild, FarChild: LongInt;
begin
  if Node < 0 then
    Exit;
  D := DistTo(Node, QX, QY);
  if (BestIndex < 0) or (D < BestDist) or ((D = BestDist) and (Node < BestIndex)) then
  begin
    BestDist := D;
    BestIndex := Node;
  end;

  Axis := Depth mod 2;
  if Axis = 0 then
    Delta := QX - Pts[Node].X
  else
    Delta := QY - Pts[Node].Y;
  if Delta <= 0 then
  begin
    NearChild := LeftChild[Node];
    FarChild := RightChild[Node];
  end
  else
  begin
    NearChild := RightChild[Node];
    FarChild := LeftChild[Node];
  end;

  Nearest(NearChild, QX, QY, Depth + 1);
  { Equality is not pruned: a point at the same distance can have a lower index. }
  if Delta * Delta <= BestDist then
    Nearest(FarChild, QX, QY, Depth + 1);
end;

var
  QX, QY: Int64;
begin
  Read(N);
  if N <= 0 then
    Exit;

  SetLength(Pts, N);
  SetLength(Order, N);
  SetLength(Tmp, N);
  SetLength(LeftChild, N);
  SetLength(RightChild, N);
  for I := 0 to N - 1 do
  begin
    Read(Pts[I].X);
    Read(Pts[I].Y);
    Order[I] := I;
  end;

  Root := Build(0, N, 0);

  Read(Q);
  for I := 1 to Q do
  begin
    Read(QX);
    Read(QY);
    BestDist := 0;
    BestIndex := -1;
    Nearest(Root, QX, QY, 0);
    WriteLn(IntToStr(BestIndex + 1));
  end;
end.
