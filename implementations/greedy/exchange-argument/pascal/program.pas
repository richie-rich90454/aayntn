{ Educational reference implementation: Pascal is not a USACO submission language. }
program ExchangeArgumentProgram;
{$mode objfpc}{$H+}

uses SysUtils;

const
  MaxN = 12;

type
  TInterval = record
    StartTime: Int64;
    EndTime: Int64;
  end;

var
  N, I, J, Mask, Count, Best, Greedy: Integer;
  S, E, FreeTime: Int64;
  Intervals, Sorted: array[0..MaxN - 1] of TInterval;
  Temp: TInterval;
  Ok: Boolean;
  Verdict: string;

function Compatible(const A, B: TInterval): Boolean;
begin
  Result := (A.EndTime <= B.StartTime) or (B.EndTime <= A.StartTime);
end;

begin
  Read(N);
  for I := 0 to N - 1 do
  begin
    Read(S);
    Read(E);
    Intervals[I].StartTime := S;
    Intervals[I].EndTime := E;
    Sorted[I] := Intervals[I];
  end;

  for I := 0 to N - 2 do
    for J := I + 1 to N - 1 do
      if (Sorted[J].EndTime < Sorted[I].EndTime) or
         ((Sorted[J].EndTime = Sorted[I].EndTime) and
          (Sorted[J].StartTime < Sorted[I].StartTime)) then
      begin
        Temp := Sorted[I];
        Sorted[I] := Sorted[J];
        Sorted[J] := Temp;
      end;

  Greedy := 0;
  FreeTime := -2000000000;
  for I := 0 to N - 1 do
    if Sorted[I].StartTime >= FreeTime then
    begin
      Greedy := Greedy + 1;
      FreeTime := Sorted[I].EndTime;
    end;

  Best := 0;
  for Mask := 0 to (1 shl N) - 1 do
  begin
    Count := 0;
    Ok := True;
    for I := 0 to N - 1 do
    begin
      if (Mask and (1 shl I)) = 0 then
        Continue;
      Count := Count + 1;
      for J := I + 1 to N - 1 do
        if ((Mask and (1 shl J)) <> 0) and (not Compatible(Intervals[I], Intervals[J])) then
        begin
          Ok := False;
          Break;
        end;
      if not Ok then
        Break;
    end;
    if Ok and (Count > Best) then
      Best := Count;
  end;

  if Greedy = Best then
    Verdict := 'MATCH'
  else
    Verdict := 'DIFFER';
  WriteLn(IntToStr(Greedy) + ' ' + IntToStr(Best));
  WriteLn(Verdict);
end.
