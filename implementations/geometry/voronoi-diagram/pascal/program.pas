{ Educational reference implementation: Pascal is not a USACO submission language. }
{ Answers the defining query directly; it does not build the full Voronoi diagram. }
program VoronoiQuery;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TPoint = record
    X: Int64;
    Y: Int64;
  end;

var
  N, Q, I, J, BestIndex: LongInt;
  Sites: array of TPoint;
  Query: TPoint;
  Best, DX, DY, D: Int64;

begin
  Read(N);
  Read(Q);
  if N <= 0 then
    Exit;

  SetLength(Sites, N);
  for I := 0 to N - 1 do
  begin
    Read(Sites[I].X);
    Read(Sites[I].Y);
  end;

  for I := 1 to Q do
  begin
    Read(Query.X);
    Read(Query.Y);
    Best := 0;
    BestIndex := -1;
    for J := 0 to N - 1 do
    begin
      DX := Sites[J].X - Query.X;
      DY := Sites[J].Y - Query.Y;
      D := DX * DX + DY * DY;
      if (BestIndex < 0) or (D < Best) or ((D = Best) and (J < BestIndex)) then
      begin
        Best := D;
        BestIndex := J;
      end;
    end;
    WriteLn(IntToStr(BestIndex + 1));
  end;
end.
