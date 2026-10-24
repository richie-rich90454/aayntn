{ Educational reference implementation: Pascal is not a USACO submission language. }

program ConstraintPropagation;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, Full: Integer;
  Count, Nodes: Int64;

procedure Search(Row, Cols, Down, Anti: Integer);
var
  Available, Bit: Integer;
begin
  Inc(Nodes);
  if Row = N then
  begin
    Inc(Count);
    Exit;
  end;
  Available := Full and not (Cols or Down or Anti);
  while Available <> 0 do
  begin
    Bit := Available and (-Available);
    Available := Available xor Bit;
    Search(Row + 1, Cols or Bit, ((Down or Bit) shl 1) and Full, (Anti or Bit) shr 1);
  end;
end;

begin
  Read(N);
  Full := (1 shl N) - 1;
  Count := 0;
  Nodes := 0;
  Search(0, 0, 0, 0);
  WriteLn(IntToStr(Count) + ' ' + IntToStr(Nodes));
end.
