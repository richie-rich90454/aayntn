program KnapsackProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;
  TTokens = array of string;

{ Reads the whole standard input so that the tokens can be split without
  depending on where the line breaks fall. }
function ReadAllInput: string;
var
  Row: string;
begin
  Result := '';
  while not EOF(Input) do
  begin
    ReadLn(Row);
    Result := Result + Row + ' ';
  end;
end;

function Tokenize(const Content: string): TTokens;
var
  I: Integer;
  Start: Integer;
begin
  SetLength(Result, 0);
  I := 1;
  while I <= Length(Content) do
  begin
    while (I <= Length(Content)) and (Content[I] <= ' ') do
      Inc(I);
    if I > Length(Content) then
      Break;
    Start := I;
    while (I <= Length(Content)) and (Content[I] > ' ') do
      Inc(I);
    SetLength(Result, Length(Result) + 1);
    Result[High(Result)] := Copy(Content, Start, I - Start);
  end;
end;

{ Maximum total value of a subset of the items whose total weight is at most
  Capacity. Weights and Values hold one entry per item. }
function KnapsackMaxValue(const Weights: TIntArray; const Values: TInt64Array;
  Capacity: Integer): Int64;
var
  Table: TInt64Array;
  I: Integer;
  C: Integer;
  Weight: Integer;
  Candidate: Int64;
begin
  if Capacity < 0 then
  begin
    Result := 0;
    Exit;
  end;

  SetLength(Table, Capacity + 1);
  for C := 0 to Capacity do
    Table[C] := 0;

  for I := 0 to High(Weights) do
  begin
    Weight := Weights[I];
    if Weight < 0 then
      Weight := 0;

    { The capacity must run downwards: Table[C - Weight] has to still hold the
      answer for the items before item I. With an upwards sweep that cell
      would already include item I, so the item would be counted more than
      once and the table would solve the unbounded knapsack. }
    for C := Capacity downto Weight do
    begin
      Candidate := Table[C - Weight] + Values[I];
      if Candidate > Table[C] then
        Table[C] := Candidate;
    end;
  end;

  Result := Table[Capacity];
end;

var
  Tokens: TTokens;
  N: Integer;
  Capacity: Integer;
  Index: Integer;
  I: Integer;
  Kept: Integer;
  Weights: TIntArray;
  Values: TInt64Array;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  Capacity := StrToIntDef(Tokens[1], 0);
  if N < 0 then
    N := 0;
  if Capacity < 0 then
    Capacity := 0;

  SetLength(Weights, N);
  SetLength(Values, N);

  Index := 2;
  Kept := 0;
  for I := 0 to N - 1 do
  begin
    if Index + 1 >= Length(Tokens) then
      Break;
    Weights[Kept] := StrToIntDef(Tokens[Index], 0);
    Values[Kept] := StrToIntDef(Tokens[Index + 1], 0);
    Inc(Index, 2);
    Inc(Kept);
  end;

  WriteLn(KnapsackMaxValue(Weights, Values, Capacity));
end.
