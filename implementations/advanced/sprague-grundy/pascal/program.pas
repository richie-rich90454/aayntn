{ Educational reference implementation: Pascal is not a USACO submission
  language. }

program SpragueGrundyProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

var
  K, H, I, S, G, MaxHeap, Total: Integer;
  Moves: array of Integer;
  Heaps: array of Integer;
  Grundy: array of Integer;
  Seen: array of Integer;
begin
  { Read the allowed moves, then the heap sizes. }
  K := 0;
  Read(K);
  if K < 0 then
    K := 0;
  SetLength(Moves, K);
  for I := 0 to K - 1 do
  begin
    Moves[I] := 0;
    Read(Moves[I]);
  end;

  H := 0;
  Read(H);
  if H < 0 then
    H := 0;
  SetLength(Heaps, H);
  MaxHeap := 0;
  for I := 0 to H - 1 do
  begin
    Heaps[I] := 0;
    Read(Heaps[I]);
    if Heaps[I] > MaxHeap then
      MaxHeap := Heaps[I];
  end;

  SetLength(Grundy, MaxHeap + 1);
  SetLength(Seen, K + 2);
  for I := 0 to K + 1 do
    Seen[I] := 0;

  for S := 1 to MaxHeap do
  begin
    for I := 0 to K - 1 do
    begin
      { The stamp S marks a value reachable from this heap size. }
      if Moves[I] <= S then
        Seen[Grundy[S - Moves[I]]] := S;
    end;
    G := 0;
    while (G <= K) and (Seen[G] = S) do
      Inc(G);
    Grundy[S] := G;
  end;

  Total := 0;
  for I := 0 to H - 1 do
  begin
    G := Grundy[Heaps[I]];
    WriteLn(IntToStr(G));
    Total := Total xor G;
  end;

  if Total <> 0 then
    WriteLn('first')
  else
    WriteLn('second');
end.
