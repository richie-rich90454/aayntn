{ Educational reference implementation: Pascal is not a USACO submission language. }
program SmallestCircleProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  { The circle is stored as the points that define it, never as a center and a
    radius: the center of a circumcircle is rational, and storing it would drag
    rational arithmetic into every containment test. }
  TPoint = record
    X: Int64;
    Y: Int64;
  end;

  TCircle = record
    Kind: Integer; { 0 point, 1 diameter, 2 counterclockwise circumcircle }
    A: TPoint;
    B: TPoint;
    C: TPoint;
  end;

function Dist2(A, B: TPoint): Int64;
var
  DX: Int64;
  DY: Int64;
begin
  DX := A.X - B.X;
  DY := A.Y - B.Y;
  Result := DX * DX + DY * DY;
end;

function Cross(A, B, C: TPoint): Int64;
begin
  Result := (B.X - A.X) * (C.Y - A.Y) - (B.Y - A.Y) * (C.X - A.X);
end;

function MakePoint(P: TPoint): TCircle;
begin
  Result.Kind := 0;
  Result.A := P;
  Result.B := P;
  Result.C := P;
end;

function MakeDiameter(A, B: TPoint): TCircle;
begin
  Result.Kind := 1;
  Result.A := A;
  Result.B := B;
  Result.C := A;
end;

function Inside(C: TCircle; P: TPoint): Boolean;
var
  AX, AY, BX, BY, CX, CY: Int64;
  AL, BL, CL: Int64;
  DET: Int64;
begin
  if C.Kind = 0 then
  begin
    Result := (C.A.X = P.X) and (C.A.Y = P.Y);
    Exit;
  end;
  if C.Kind = 1 then
  begin
    Result := (P.X - C.A.X) * (P.X - C.B.X) + (P.Y - C.A.Y) * (P.Y - C.B.Y) <= 0;
    Exit;
  end;
  AX := C.A.X - P.X;
  AY := C.A.Y - P.Y;
  BX := C.B.X - P.X;
  BY := C.B.Y - P.Y;
  CX := C.C.X - P.X;
  CY := C.C.Y - P.Y;
  AL := AX * AX + AY * AY;
  BL := BX * BX + BY * BY;
  CL := CX * CX + CY * CY;
  DET := AX * (BY * CL - BL * CY)
       - AY * (BX * CL - BL * CX)
       + AL * (BX * CY - BY * CX);
  Result := DET >= 0;
end;

{ Three non-collinear points have exactly one circumcircle. Three collinear
  points have none, and the smallest circle containing them is the diameter of
  the farthest pair. }
procedure SetCircumcircle(var C: TCircle; A, B, D: TPoint);
var
  T: TPoint;
  AB, AD, BD: Int64;
begin
  if Cross(A, B, D) < 0 then
  begin
    T := B;
    B := D;
    D := T;
  end;
  if Cross(A, B, D) = 0 then
  begin
    AB := Dist2(A, B);
    AD := Dist2(A, D);
    BD := Dist2(B, D);
    if (AB >= AD) and (AB >= BD) then
      C := MakeDiameter(A, B)
    else if AD >= BD then
      C := MakeDiameter(A, D)
    else
      C := MakeDiameter(B, D);
    Exit;
  end;
  C.Kind := 2;
  C.A := A;
  C.B := B;
  C.C := D;
end;

function SquaredRadius(C: TCircle): Int64;
var
  AB, BC, CA, CR: Int64;
begin
  if C.Kind = 0 then
  begin
    Result := 0;
    Exit;
  end;
  if C.Kind = 1 then
  begin
    Result := Dist2(C.A, C.B) div 4;
    Exit;
  end;
  AB := Dist2(C.A, C.B);
  BC := Dist2(C.B, C.C);
  CA := Dist2(C.C, C.A);
  CR := Cross(C.A, C.B, C.C);
  Result := (AB * BC * CA) div (4 * CR * CR);
end;

var
  N, I, J, K: Integer;
  Pts: array of TPoint;
  Circle: TCircle;
begin
  Read(N);
  if N <= 0 then
  begin
    WriteLn('0');
    Exit;
  end;
  SetLength(Pts, N);
  for I := 0 to N - 1 do
  begin
    Read(Pts[I].X);
    Read(Pts[I].Y);
  end;

  Circle := MakePoint(Pts[0]);
  for I := 0 to N - 1 do
  begin
    if Inside(Circle, Pts[I]) then
      Continue;
    Circle := MakePoint(Pts[I]);
    for J := 0 to I - 1 do
    begin
      if Inside(Circle, Pts[J]) then
        Continue;
      Circle := MakeDiameter(Pts[I], Pts[J]);
      for K := 0 to J - 1 do
        if not Inside(Circle, Pts[K]) then
          SetCircumcircle(Circle, Pts[I], Pts[J], Pts[K]);
    end;
  end;

  WriteLn(IntToStr(SquaredRadius(Circle)));
end.
