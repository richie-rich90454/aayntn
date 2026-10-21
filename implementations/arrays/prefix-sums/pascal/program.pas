program PrefixSumsProgram;
{$mode objfpc}{$H+}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TIntArray = array of Int64;
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

{ Prefix sums over an array of values.

  Contract: on return Prefix[0] = 0 and Prefix[i] = Prefix[i-1] + A[i-1]
  for every 1 <= i <= N, so the sum of A[l-1 .. r-1] is
  Prefix[r] - Prefix[l-1].

  Ownership: the caller owns both buffers. Prefix must have room for N+1
  elements; the procedure allocates nothing and frees nothing. }
procedure PrefixSums(const A: array of Int64; N: Integer; var Prefix: TIntArray);
var
  I: Integer;
begin
  if (N < 0) or (Length(A) < N) or (Length(Prefix) < N + 1) then
    Exit;
  Prefix[0] := 0;
  for I := 0 to N - 1 do
    Prefix[I + 1] := Prefix[I] + A[I];
end;

var
  Tokens: TTokens;
  N: Integer;
  Q: Integer;
  I: Integer;
  Index: Integer;
  L: Int64;
  R: Int64;
  Value: Int64;
  A: TIntArray;
  Prefix: TIntArray;
  SumText: string;
begin
  Tokens := Tokenize(ReadAllInput);
  if Length(Tokens) = 0 then
    Halt(0);

  if not ParseInt(Tokens[0], Value) then
    Halt(0);
  if Value < 0 then
    Value := 0;
  if Value > 2147483647 then
    Value := 2147483647;
  N := Integer(Value);

  { The values start at zero, so a truncated input leaves zeros behind. }
  SetLength(A, N);
  for I := 0 to N - 1 do
  begin
    A[I] := 0;
    if I + 1 < Length(Tokens) then
      if ParseInt(Tokens[I + 1], Value) then
        A[I] := Value;
  end;

  SetLength(Prefix, N + 1);
  PrefixSums(A, N, Prefix);

  Q := 0;
  if N + 1 < Length(Tokens) then
    if ParseInt(Tokens[N + 1], Value) then
    begin
      if Value < 0 then
        Value := 0;
      if Value > 2147483647 then
        Value := 2147483647;
      Q := Integer(Value);
    end;

  Index := N + 2;
  for I := 0 to Q - 1 do
  begin
    if Index + 1 >= Length(Tokens) then
      Break;
    if not ParseInt(Tokens[Index], Value) then
      Break;
    L := Value;
    if not ParseInt(Tokens[Index + 1], Value) then
      Break;
    R := Value;
    Inc(Index, 2);

    { A range that leaves the array is clipped, so the lookup stays in
      bounds; a range that is empty after clipping sums to zero. }
    if L < 1 then
      L := 1;
    if R > N then
      R := N;
    if L > R then
      SumText := '0'
    else
      SumText := IntToStr(Prefix[R] - Prefix[L - 1]);
    WriteLn(SumText);
  end;
end.
