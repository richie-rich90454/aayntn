program SqrtDecomposition;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

var
  N, Q, K, Kind, Index, Left, Right, Block, Blocks, FirstFull, LastFull: Integer;
  Delta, Total: Int64;
  Value, Sum: array of Int64;

begin
  { The input is exactly the contract: n, q and the q operations. }
  N := 0;
  Read(N);
  Q := 0;
  Read(Q);
  if N < 0 then
    N := 0;

  { ceil(sqrt(N)) without floating point. }
  Block := 1;
  while Int64(Block) * Block < N do
    Inc(Block);
  Blocks := (N + Block - 1) div Block;

  SetLength(Value, N);
  SetLength(Sum, Blocks);
  for K := 0 to N - 1 do
    Value[K] := 0;
  for K := 0 to Blocks - 1 do
    Sum[K] := 0;

  for K := 0 to Q - 1 do
  begin
    Kind := 0;
    Read(Kind);
    if (Kind <> 1) and (Kind <> 2) then
      Break;
    if Kind = 1 then
    begin
      Read(Index);
      Read(Delta);
      Dec(Index);
      if (Index >= 0) and (Index < N) then
      begin
        Value[Index] := Value[Index] + Delta;
        Sum[Index div Block] := Sum[Index div Block] + Delta;
      end;
    end
    else
    begin
      Read(Left);
      Read(Right);
      Dec(Left);
      Dec(Right);
      if Left < 0 then
        Left := 0;
      if Right >= N then
        Right := N - 1;

      Total := 0;
      if Left <= Right then
      begin
        FirstFull := (Left + Block - 1) div Block;
        LastFull := (Right + 1) div Block - 1;
        if FirstFull > LastFull then
        begin
          { The range lies inside one block, or in two partial ones. }
          for Index := Left to Right do
            Total := Total + Value[Index];
        end
        else
        begin
          for Index := Left to FirstFull * Block - 1 do
            Total := Total + Value[Index];
          for Index := FirstFull to LastFull do
            Total := Total + Sum[Index];
          for Index := (LastFull + 1) * Block to Right do
            Total := Total + Value[Index];
        end;
      end;
      WriteLn(Total);
    end;
  end;
end.
