program BinarySearchProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Int64;
  TTokens = array of string;

{ Reads the whole standard input, one line at a time, so that the tokens can
  be split without depending on where the line breaks fall. }
function ReadAllInput: string;
var
  Row: string;
begin
  Result := '';
  ReadLn(Row);
  while Row <> '' do
  begin
    Result := Result + Row + ' ';
    ReadLn(Row);
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

{ Parses a decimal integer token. Val reports a malformed token through its
  error code, so the caller never has to guard the conversion. }
function ParseInt(const Token: string; var Value: Int64): Boolean;
var
  ErrCode: Integer;
begin
  Result := False;
  Value := 0;
  if Token = '' then
    Exit;
  Val(Token, Value, ErrCode);
  if ErrCode = 0 then
    Result := True;
end;

{ Binary search over a sorted array.

  Contract: A[0 .. High(A)] is sorted in non-decreasing order and the search
  interval is inclusive on both ends. Returns the 0-based index of an element
  equal to Target, or -1 when the target is absent. }
function BinarySearch(const A: array of Int64; Target: Int64): Integer;
var
  Lo, Hi, Mid: Integer;
begin
  Lo := 0;
  Hi := High(A);
  Result := -1;
  while Lo <= Hi do
  begin
    { Lo + (Hi - Lo) div 2 cannot overflow the way (Lo + Hi) div 2 can. }
    Mid := Lo + (Hi - Lo) div 2;
    if A[Mid] = Target then
    begin
      Result := Mid;
      Break;
    end;
    if A[Mid] < Target then
      Lo := Mid + 1
    else
      Hi := Mid - 1;
  end;
end;

var
  Tokens: TTokens;
  Values: TIntArray;
  ValueCount: Integer;
  Declared, Target, Available: Int64;
  ArrayLength: Integer;
  I: Integer;
  A: TIntArray;
begin
  { The target is the final token and the array takes at most n of the tokens
    before it, so a header that disagrees with the data cannot swallow the
    target. }
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) < 2 then
  begin
    { An input with fewer than two tokens holds neither an array nor a target. }
    WriteLn(-1);
  end
  else
  begin
    ValueCount := Length(Tokens);
    SetLength(Values, ValueCount);
    for I := 0 to ValueCount - 1 do
      if not ParseInt(Tokens[I], Values[I]) then
        Values[I] := 0;

    Declared := Values[0];
    Target := Values[ValueCount - 1];
    Available := ValueCount - 2;
    if Declared < 0 then
      Declared := 0;
    if Declared > Available then
      Declared := Available;
    ArrayLength := Integer(Declared);

    SetLength(A, ArrayLength);
    for I := 0 to ArrayLength - 1 do
      A[I] := Values[I + 1];

    WriteLn(BinarySearch(A, Target));
  end;
end.
