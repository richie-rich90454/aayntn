{ Educational reference implementation: Pascal is not a USACO submission language. }
program BitsetOptimization;
{$mode objfpc}{$H+}
{$I-}
{$Q-}
{$R-}

uses SysUtils;

const
  WORD_BITS = 32;

var
  N, I, K, Q, R, TopBits, Words: LongInt;
  Limit, Weight: LongInt;
  Answer: LongInt;
  Moved: LongWord;
  Reachable: array of LongWord;

function PopCount(Value: LongWord): LongInt;
var
  V: LongWord;
begin
  V := Value;
  V := V - ((V shr 1) and $55555555);
  V := (V and $33333333) + ((V shr 2) and $33333333);
  V := (V + (V shr 4)) and $0F0F0F0F;
  V := (V + (V shr 8)) and $00FF00FF;
  V := (V + (V shr 16)) and $0000FFFF;
  PopCount := LongInt(V);
end;

begin
  Read(N);
  Read(Limit);

  Words := (Limit div WORD_BITS) + 1;
  TopBits := (Limit mod WORD_BITS) + 1;
  SetLength(Reachable, Words);
  for I := 0 to Words - 1 do
    Reachable[I] := 0;
  Reachable[0] := 1;

  for K := 1 to N do
  begin
    Weight := 0;
    Read(Weight);
    if (Weight <= 0) or (Weight > Limit) then
      Continue;

    Q := Weight div WORD_BITS;
    R := Weight mod WORD_BITS;

    { Descending, so each source word still holds its value from before this weight. }
    for I := Words - 1 downto Q do
    begin
      Moved := Reachable[I - Q] shl R;
      if (R > 0) and (I - Q - 1 >= 0) then
        Moved := Moved or (Reachable[I - Q - 1] shr (WORD_BITS - R));
      Reachable[I] := Reachable[I] or Moved;
    end;

    if TopBits < WORD_BITS then
      Reachable[Words - 1] := Reachable[Words - 1] and ((LongWord(1) shl TopBits) - 1);
  end;

  Answer := 0;
  for I := 0 to Words - 1 do
    Answer := Answer + PopCount(Reachable[I]);
  WriteLn(Answer);
end.
