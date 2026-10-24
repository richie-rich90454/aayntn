{ Educational reference implementation: Pascal is not a USACO submission language. }
program ParametricSearchProgram;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N: Integer;
  I: Integer;
  A: array of Int64;
  MaxValue: Int64;
  Budget: Int64;
  Lo: Int64;
  Hi: Int64;
  Mid: Int64;
  Answer: Int64;

function Feasible(const Values: array of Int64; Level: Int64; Limit: Int64): Boolean;
var
  J: Integer;
  Sum: Int64;
begin
  Sum := 0;
  for J := 0 to High(Values) do
  begin
    if Values[J] < Level then
      Sum := Sum + Values[J]
    else
      Sum := Sum + Level;
    if Sum > Limit then
    begin
      Result := False;
      Exit;
    end;
  end;
  Result := True;
end;

begin
  Read(N);
  if N <= 0 then
  begin
    WriteLn(0);
    Exit;
  end;

  SetLength(A, N);
  MaxValue := 0;
  for I := 0 to N - 1 do
  begin
    Read(A[I]);
    if A[I] > MaxValue then
      MaxValue := A[I];
  end;
  Read(Budget);

  Lo := 0;
  Hi := MaxValue;
  Answer := 0;
  while Lo <= Hi do
  begin
    Mid := Lo + (Hi - Lo) div 2;
    if Feasible(A, Mid, Budget) then
    begin
      Answer := Mid;
      Lo := Mid + 1;
    end
    else
      Hi := Mid - 1;
  end;
  WriteLn(Answer);
end.
