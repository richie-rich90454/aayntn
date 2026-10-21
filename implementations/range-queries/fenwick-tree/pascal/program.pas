program FenwickProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;

  { A Fenwick tree (binary indexed tree) over a 1-indexed array: Tree[i] holds
    the sum of the positions in the block (i - lowbit(i), i], where lowbit(i)
    is the largest power of two that divides i.

    Ownership: the constructor allocates the tree and the destructor releases
    it, so the caller owns the instance and must free it exactly once. }
  TFenwick = class
  private
    FN: Integer;
    FTree: array of Int64;
  public
    constructor Create(N: Integer);
    destructor Destroy; override;
    procedure Add(Index: Integer; Delta: Int64);
    function PrefixSum(Index: Integer): Int64;
    function RangeSum(Left, Right: Integer): Int64;
  end;

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

constructor TFenwick.Create(N: Integer);
begin
  inherited Create;
  if N < 0 then
    N := 0;
  FN := N;
  SetLength(FTree, N + 1);
  FillChar(FTree[0], (N + 1) * SizeOf(Int64), 0);
end;

destructor TFenwick.Destroy;
begin
  SetLength(FTree, 0);
  inherited Destroy;
end;

{ Adds Delta to the value at the 1-based Index. }
procedure TFenwick.Add(Index: Integer; Delta: Int64);
var
  I: Integer;
begin
  if Index < 1 then
    Exit;
  { Stepping up by lowbit visits exactly the blocks that contain the index. }
  I := Index;
  while I <= FN do
  begin
    FTree[I] := FTree[I] + Delta;
    I := I + (I and (-I));
  end;
end;

{ The sum of the positions 1..Index. }
function TFenwick.PrefixSum(Index: Integer): Int64;
var
  I: Integer;
begin
  if Index > FN then
    Index := FN;
  Result := 0;
  { Stepping down by lowbit visits disjoint blocks that partition 1..Index. }
  I := Index;
  while I > 0 do
  begin
    Result := Result + FTree[I];
    I := I - (I and (-I));
  end;
end;

{ The sum of the positions Left..Right, both inclusive. }
function TFenwick.RangeSum(Left, Right: Integer): Int64;
begin
  Result := PrefixSum(Right) - PrefixSum(Left - 1);
end;

var
  Tokens: TTokens;
  N: Integer;
  Q: Integer;
  K: Integer;
  Index: Integer;
  Kind: Integer;
  A: Integer;
  B: Integer;
  Tree: TFenwick;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  Q := StrToIntDef(Tokens[1], 0);
  if N < 0 then
    N := 0;
  if Q < 0 then
    Q := 0;

  Tree := TFenwick.Create(N);

  Index := 2;
  for K := 1 to Q do
  begin
    if Index >= Length(Tokens) then
      Break;
    Kind := StrToIntDef(Tokens[Index], 0);
    Inc(Index);
    if (Kind <> 1) and (Kind <> 2) then
      Break;
    if Index + 1 >= Length(Tokens) then
      Break;
    A := StrToIntDef(Tokens[Index], 0);
    B := StrToIntDef(Tokens[Index + 1], 0);
    Inc(Index, 2);
    if Kind = 1 then
    begin
      Tree.Add(A, B);
    end
    else
    begin
      WriteLn(Tree.RangeSum(A, B));
    end;
  end;

  Tree.Free;
end.
