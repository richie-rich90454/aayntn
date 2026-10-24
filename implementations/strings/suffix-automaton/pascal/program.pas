{ Educational reference implementation: Pascal is not a USACO submission language. }
program SuffixAutomatonProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TIntArray = array of Integer;
  TInt64Array = array of Int64;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

var
  S: string;
  N: Integer;
  I: Integer;
  C: Integer;
  Cur: Integer;
  P: Integer;
  Q: Integer;
  Clone: Integer;
  Last: Integer;
  Size: Integer;
  States: Integer;
  V: Integer;
  Smallest: Integer;
  Target: Integer;
  Distinct: Int64;
  Go: TIntArray;
  MaxLen: TIntArray;
  Link: TIntArray;
  Count: TInt64Array;
  Bucket: TIntArray;
  Order: TIntArray;
begin
  { The input is exactly the contract: one line holding the string. }
  ReadLn(S);
  StripCR(S);
  N := Length(S);
  if N = 0 then
  begin
    WriteLn('0');
    WriteLn('0');
    Exit;
  end;

  States := 2 * N + 2;
  SetLength(Go, States * 26);
  for I := 0 to High(Go) do
    Go[I] := -1;
  SetLength(MaxLen, States);
  SetLength(Link, States);
  SetLength(Count, States);
  for I := 0 to States - 1 do
  begin
    MaxLen[I] := 0;
    Link[I] := 0;
    Count[I] := 0;
  end;
  Link[0] := -1;

  { Extend the automaton by one character at a time. }
  Size := 1;
  Last := 0;
  for I := 1 to N do
  begin
    C := Ord(S[I]) - Ord('a');
    Cur := Size;
    Inc(Size);
    MaxLen[Cur] := MaxLen[Last] + 1;
    Count[Cur] := 1;

    P := Last;
    while (P <> -1) and (Go[P * 26 + C] = -1) do
    begin
      Go[P * 26 + C] := Cur;
      P := Link[P];
    end;

    if P = -1 then
      Link[Cur] := 0
    else
    begin
      Q := Go[P * 26 + C];
      if MaxLen[P] + 1 = MaxLen[Q] then
        Link[Cur] := Q
      else
      begin
        Clone := Size;
        Inc(Size);
        MaxLen[Clone] := MaxLen[P] + 1;
        for V := 0 to 25 do
          Go[Clone * 26 + V] := Go[Q * 26 + V];
        Link[Clone] := Link[Q];
        Count[Clone] := 0;

        while (P <> -1) and (Go[P * 26 + C] = Q) do
        begin
          Go[P * 26 + C] := Clone;
          P := Link[P];
        end;
        Link[Q] := Clone;
        Link[Cur] := Clone;
      end;
    end;
    Last := Cur;
  end;

  { Counting sort the states by the length of their longest string. }
  SetLength(Bucket, N + 1);
  for I := 0 to N do
    Bucket[I] := 0;
  for V := 1 to Size - 1 do
    Inc(Bucket[MaxLen[V]]);
  for I := 1 to N do
    Bucket[I] := Bucket[I] + Bucket[I - 1];

  SetLength(Order, Size - 1);
  for V := Size - 1 downto 1 do
  begin
    Bucket[MaxLen[V]] := Bucket[MaxLen[V]] - 1;
    Order[Bucket[MaxLen[V]]] := V;
  end;

  { Push every count to its suffix link, longest states first. }
  for I := Size - 2 downto 0 do
  begin
    V := Order[I];
    Count[Link[V]] := Count[Link[V]] + Count[V];
  end;

  Distinct := 0;
  for V := 1 to Size - 1 do
    Distinct := Distinct + (MaxLen[V] - MaxLen[Link[V]]);

  Smallest := 25;
  for I := 1 to N do
  begin
    C := Ord(S[I]) - Ord('a');
    if C < Smallest then
      Smallest := C;
  end;
  Target := Go[Smallest];

  WriteLn(IntToStr(Distinct));
  WriteLn(IntToStr(Count[Target]));
end.
