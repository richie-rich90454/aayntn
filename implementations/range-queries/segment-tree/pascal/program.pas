program SegmentTreeProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;
  TInt64Array = array of Int64;

  { A segment tree over a 1-indexed array of n values: Tree[node] holds the
    sum of the values of the range that the node covers, so every node caches
    the result of merging its two children.

    Ownership: the constructor allocates the tree and the destructor releases
    it, so the caller owns the instance and must free it exactly once. }
  TSegmentTree = class
  private
    FN: Integer;
    FTree: array of Int64;
    procedure Build(Node, Lo, Hi: Integer; const Values: array of Int64);
    procedure AssignAt(Node, Lo, Hi, Index: Integer; Value: Int64);
    function QueryAt(Node, Lo, Hi, Left, Right: Integer): Int64;
  public
    constructor Create(const Values: array of Int64);
    destructor Destroy; override;
    procedure SetValue(Index: Integer; Value: Int64);
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

{ Fills the subtree of Node, which covers the positions Lo..Hi. }
procedure TSegmentTree.Build(Node, Lo, Hi: Integer; const Values: array of Int64);
var
  Mid: Integer;
begin
  if Lo = Hi then
  begin
    FTree[Node] := Values[Lo - 1];
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  Build(Node * 2, Lo, Mid, Values);
  Build(Node * 2 + 1, Mid + 1, Hi, Values);
  FTree[Node] := FTree[Node * 2] + FTree[Node * 2 + 1];
end;

{ Assigns the value at the 1-based Index inside the subtree of Node. }
procedure TSegmentTree.AssignAt(Node, Lo, Hi, Index: Integer; Value: Int64);
var
  Mid: Integer;
begin
  if Lo = Hi then
  begin
    FTree[Node] := Value;
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  if Index <= Mid then
    AssignAt(Node * 2, Lo, Mid, Index, Value)
  else
    AssignAt(Node * 2 + 1, Mid + 1, Hi, Index, Value);
  { Merging the two children restores the invariant of the node. }
  FTree[Node] := FTree[Node * 2] + FTree[Node * 2 + 1];
end;

{ The sum of the positions Left..Right inside the subtree of Node. }
function TSegmentTree.QueryAt(Node, Lo, Hi, Left, Right: Integer): Int64;
var
  Mid: Integer;
begin
  if (Right < Lo) or (Hi < Left) then
  begin
    { The queried range and the subtree do not overlap. }
    Result := 0;
    Exit;
  end;
  if (Left <= Lo) and (Hi <= Right) then
  begin
    Result := FTree[Node];
    Exit;
  end;
  Mid := Lo + (Hi - Lo) div 2;
  Result := QueryAt(Node * 2, Lo, Mid, Left, Right) +
            QueryAt(Node * 2 + 1, Mid + 1, Hi, Left, Right);
end;

constructor TSegmentTree.Create(const Values: array of Int64);
begin
  inherited Create;
  FN := Length(Values);
  { A binary tree over n leaves fits in 4n nodes when the root is the 1. }
  SetLength(FTree, 4 * FN + 4);
  FillChar(FTree[0], Length(FTree) * SizeOf(Int64), 0);
  if FN > 0 then
    Build(1, 1, FN, Values);
end;

destructor TSegmentTree.Destroy;
begin
  SetLength(FTree, 0);
  inherited Destroy;
end;

{ Assigns the value at the 1-based Index; an index outside 1..n is ignored. }
procedure TSegmentTree.SetValue(Index: Integer; Value: Int64);
begin
  if (Index < 1) or (Index > FN) then
    Exit;
  AssignAt(1, 1, FN, Index, Value);
end;

{ The sum of the positions Left..Right, both inclusive. }
function TSegmentTree.RangeSum(Left, Right: Integer): Int64;
begin
  if Left < 1 then
    Left := 1;
  if Right > FN then
    Right := FN;
  if Left > Right then
  begin
    Result := 0;
    Exit;
  end;
  Result := QueryAt(1, 1, FN, Left, Right);
end;

var
  Tokens: TTokens;
  Values: TInt64Array;
  N: Integer;
  Q: Integer;
  K: Integer;
  I: Integer;
  Kind: Integer;
  A: Integer;
  B: Int64;
  Index: Integer;
  Tree: TSegmentTree;
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

  { Every position starts at zero, because the input carries no values. }
  SetLength(Values, N);
  for I := 0 to N - 1 do
    Values[I] := 0;
  Tree := TSegmentTree.Create(Values);

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
    B := StrToInt64Def(Tokens[Index + 1], 0);
    Inc(Index, 2);
    if Kind = 1 then
      Tree.SetValue(A, B)
    else
    begin
      { An explicit line feed keeps the output identical on every platform. }
      Write(IntToStr(Tree.RangeSum(A, B)), #10);
    end;
  end;

  Tree.Free;
end.
