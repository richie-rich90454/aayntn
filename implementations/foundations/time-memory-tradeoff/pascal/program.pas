{ Educational reference implementation: Pascal is not a USACO submission language. }
program TimeMemoryTradeoff;
{$mode objfpc}{$H+}

uses SysUtils;

var
  N, Q, B, Blocks, I, L, R, LeftIndex, StartIndex, EndIndex, BlockIndex: Integer;
  Inside, Base: array of Int64;
  Running, Total, PrefixRight, PrefixLeft: Int64;

begin
  Read(N);
  if N < 1 then
    Exit;

  SetLength(Inside, N + 1);
  for I := 1 to N do
    Read(Inside[I]);

  B := 1;
  while Int64(B + 1) * (B + 1) <= N do
    Inc(B);
  Blocks := (N + B - 1) div B;

  SetLength(Base, Blocks + 1);
  Total := 0;
  for BlockIndex := 0 to Blocks - 1 do
  begin
    Base[BlockIndex] := Total;
    StartIndex := BlockIndex * B + 1;
    EndIndex := StartIndex + B - 1;
    if EndIndex > N then
      EndIndex := N;
    Running := 0;
    for I := StartIndex to EndIndex do
    begin
      Running := Running + Inside[I];
      Inside[I] := Running;
    end;
    Total := Total + Running;
  end;
  Base[Blocks] := Total;

  Read(Q);
  for I := 1 to Q do
  begin
    Read(L);
    Read(R);
    if R = 0 then
      PrefixRight := 0
    else
      PrefixRight := Base[(R - 1) div B] + Inside[R];
    LeftIndex := L - 1;
    if LeftIndex = 0 then
      PrefixLeft := 0
    else
      PrefixLeft := Base[(LeftIndex - 1) div B] + Inside[LeftIndex];
    WriteLn(IntToStr(PrefixRight - PrefixLeft));
  end;
end.
