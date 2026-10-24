{ Educational reference implementation: Pascal is not a USACO submission language. }
program RobustPredicates;
{$mode objfpc}{$H+}

{ The orientation predicate is the sign of the cross product of B - A and
  C - A. With coordinates of magnitude at most 10^6 every difference is at
  most 2 * 10^6, every product is at most 4 * 10^12 and the cross product is
  at most 8 * 10^12, which Int64 holds exactly. }

uses SysUtils;

function OrientationSign(Value: Int64): LongInt;
begin
  if Value > 0 then
    OrientationSign := 1
  else if Value < 0 then
    OrientationSign := -1
  else
    OrientationSign := 0;
end;

var
  Q, I: LongInt;
  Ax, Ay, Bx, By, Cx, Cy, D: Int64;
  Ux, Uy, Vx, Vy: Int64;

begin
  Q := 0;
  Read(Q);
  for I := 1 to Q do
  begin
    Ax := 0;
    Read(Ax);
    Ay := 0;
    Read(Ay);
    Bx := 0;
    Read(Bx);
    By := 0;
    Read(By);
    Cx := 0;
    Read(Cx);
    Cy := 0;
    Read(Cy);

    Ux := Bx - Ax;
    Uy := By - Ay;
    Vx := Cx - Ax;
    Vy := Cy - Ay;
    D := Ux * Vy - Uy * Vx;

    WriteLn(IntToStr(OrientationSign(D)));
  end;
end.
