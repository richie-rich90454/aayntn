program DsuProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TTokens = array of string;

  { A disjoint set over the elements 0..n-1.

    Union by size keeps the trees shallow and path compression flattens them,
    so the two together make every operation take amortised constant time.

    Ownership: the constructor allocates the parent and size arrays and the
    destructor releases them, so the caller owns the instance and must free it
    exactly once. }
  TDisjointSet = class
  private
    FParent: array of Integer;
    FSize: array of Integer;
  public
    constructor Create(N: Integer);
    destructor Destroy; override;
    function Find(X: Integer): Integer;
    procedure Unite(A, B: Integer);
    function Same(A, B: Integer): Boolean;
  end;

constructor TDisjointSet.Create(N: Integer);
var
  I: Integer;
begin
  inherited Create;
  if N < 0 then
    N := 0;
  SetLength(FParent, N);
  SetLength(FSize, N);
  for I := 0 to N - 1 do
  begin
    FParent[I] := I;
    FSize[I] := 1;
  end;
end;

destructor TDisjointSet.Destroy;
begin
  SetLength(FParent, 0);
  SetLength(FSize, 0);
  inherited Destroy;
end;

{ The representative of the set holding X, compressing the path to it. }
function TDisjointSet.Find(X: Integer): Integer;
var
  Root: Integer;
  Next: Integer;
begin
  Root := X;
  while FParent[Root] <> Root do
    Root := FParent[Root];
  { Every element on the path now points at the root. }
  while FParent[X] <> X do
  begin
    Next := FParent[X];
    FParent[X] := Root;
    X := Next;
  end;
  Result := Root;
end;

{ Merges the sets holding A and B. }
procedure TDisjointSet.Unite(A, B: Integer);
var
  RootA: Integer;
  RootB: Integer;
  Temp: Integer;
begin
  RootA := Find(A);
  RootB := Find(B);
  if RootA = RootB then
    Exit;
  { The larger set absorbs the smaller one, which keeps the trees shallow. }
  if FSize[RootA] < FSize[RootB] then
  begin
    Temp := RootA;
    RootA := RootB;
    RootB := Temp;
  end;
  FParent[RootB] := RootA;
  FSize[RootA] := FSize[RootA] + FSize[RootB];
end;

{ Whether A and B belong to the same set. }
function TDisjointSet.Same(A, B: Integer): Boolean;
begin
  Result := Find(A) = Find(B);
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

var
  Tokens: TTokens;
  N: Integer;
  Q: Integer;
  I: Integer;
  Index: Integer;
  Op: Integer;
  U: Integer;
  V: Integer;
  Valid: Boolean;
  Groups: TDisjointSet;
  Row: string;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
    Halt(0);

  N := StrToIntDef(Tokens[0], 0);
  Q := StrToIntDef(Tokens[1], 0);
  if Q < 0 then
    Q := 0;

  Groups := TDisjointSet.Create(N);

  Index := 2;
  for I := 0 to Q - 1 do
  begin
    if Index + 2 >= Length(Tokens) then
      Break;
    Op := StrToIntDef(Tokens[Index], -1);
    U := StrToIntDef(Tokens[Index + 1], -1);
    V := StrToIntDef(Tokens[Index + 2], -1);
    Inc(Index, 3);
    Valid := (U >= 0) and (U < N) and (V >= 0) and (V < N);
    if Op = 1 then
    begin
      if Valid then
        Groups.Unite(U, V);
    end
    else if Op = 2 then
    begin
      if Valid and Groups.Same(U, V) then
        Row := Row + 'yes' + #10
      else
        Row := Row + 'no' + #10;
    end;
  end;

  Groups.Free;
  { An explicit line feed keeps the output identical on every platform. }
  Write(Row);
end.
