program FloydWarshallProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

const
  { Larger than any shortest path this program can build from two finite
    values. The reference compiler represents Int64 as a JavaScript number,
    so the sentinel is kept below 2^53 and every distance the fixtures use is
    exact. }
  Infinity: Int64 = 4000000000000000;

type
  TInt64Array = array of Int64;

var
  N: Integer;
  M: Integer;
  I: Integer;
  J: Integer;
  K: Integer;
  U: Integer;
  V: Integer;
  RowI: Integer;
  RowK: Integer;
  At: Integer;
  W: Int64;
  Through: Int64;
  Rest: Int64;
  Candidate: Int64;
  Distance: TInt64Array;

begin
  N := 0;
  Read(N);
  if N < 0 then
    N := 0;
  M := 0;
  Read(M);
  if N <= 0 then
  begin
    WriteLn;
    Exit;
  end;
  if M < 0 then
    M := 0;

  SetLength(Distance, N * N);
  for I := 0 to High(Distance) do
    Distance[I] := Infinity;
  for I := 0 to N - 1 do
    Distance[I * N + I] := 0;

  for I := 0 to M - 1 do
  begin
    U := 0;
    V := 0;
    W := 0;
    Read(U);
    Read(V);
    Read(W);
    if (U < 0) or (U >= N) or (V < 0) or (V >= N) then
      Continue;
    At := U * N + V;
    if W < Distance[At] then
      { Parallel edges are allowed, and only the cheaper one matters. }
      Distance[At] := W;
  end;

  for K := 0 to N - 1 do
  begin
    RowK := K * N;
    for I := 0 to N - 1 do
    begin
      RowI := I * N;
      Through := Distance[RowI + K];
      if Through = Infinity then
        Continue;
      for J := 0 to N - 1 do
      begin
        Rest := Distance[RowK + J];
        if Rest = Infinity then
          Continue;
        Candidate := Through + Rest;
        if Candidate < Distance[RowI + J] then
          Distance[RowI + J] := Candidate;
      end;
    end;
  end;

  for I := 0 to N - 1 do
  begin
    if Distance[I * N + I] < 0 then
    begin
      WriteLn('negative cycle');
      Exit;
    end;
  end;

  for I := 0 to N - 1 do
  begin
    for J := 0 to N - 1 do
    begin
      if J > 0 then
        Write(' ');
      if Distance[I * N + J] = Infinity then
        Write(-1)
      else
        Write(Distance[I * N + J]);
    end;
    WriteLn;
  end;
end.
