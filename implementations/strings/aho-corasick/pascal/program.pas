program AhoCorasickProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TStringArray = array of string;
  TIntArray = array of Integer;
  TInt64Array = array of Int64;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var S: string);
begin
  while (Length(S) > 0) and (S[Length(S)] = #13) do
    SetLength(S, Length(S) - 1);
end;

var
  N: Integer;
  I: Integer;
  J: Integer;
  C: Integer;
  V: Integer;
  U: Integer;
  FV: Integer;
  Nodes: Integer;
  Head: Integer;
  Tail: Integer;
  State: Integer;
  Total: Integer;
  Dummy: string;
  Text: string;
  Pats: TStringArray;
  Terminal: TIntArray;
  Fail: TIntArray;
  Order: TIntArray;
  Go: TIntArray;
  Cnt: TInt64Array;
begin
  { The input is exactly the contract: n, the n patterns, then the text. }
  Read(N);
  ReadLn(Dummy);
  if N < 0 then
    N := 0;

  SetLength(Pats, N);
  Total := 0;
  for I := 0 to N - 1 do
  begin
    ReadLn(Pats[I]);
    StripCR(Pats[I]);
    Total := Total + Length(Pats[I]);
  end;

  SetLength(Go, (Total + 1) * 26);
  for I := 0 to High(Go) do
    Go[I] := -1;
  SetLength(Fail, Total + 1);
  SetLength(Cnt, Total + 1);
  SetLength(Order, Total + 1);
  SetLength(Terminal, N);
  for I := 0 to Total do
  begin
    Fail[I] := 0;
    Cnt[I] := 0;
  end;

  { Insert every pattern, remembering the terminal node of each one. }
  Nodes := 1;
  for I := 0 to N - 1 do
  begin
    V := 0;
    for J := 1 to Length(Pats[I]) do
    begin
      C := Ord(Pats[I][J]) - Ord('a');
      if (C < 0) or (C >= 26) then
        Continue;
      if Go[V * 26 + C] = -1 then
      begin
        Go[V * 26 + C] := Nodes;
        Inc(Nodes);
      end;
      V := Go[V * 26 + C];
    end;
    Terminal[I] := V;
  end;

  { Build the failure links and complete the transition table. }
  Head := 0;
  Tail := 0;
  for C := 0 to 25 do
  begin
    U := Go[C];
    if U = -1 then
      Go[C] := 0
    else
    begin
      Fail[U] := 0;
      Order[Tail] := U;
      Inc(Tail);
    end;
  end;
  while Head < Tail do
  begin
    V := Order[Head];
    Inc(Head);
    FV := Fail[V];
    for C := 0 to 25 do
    begin
      U := Go[V * 26 + C];
      if U = -1 then
        Go[V * 26 + C] := Go[FV * 26 + C]
      else
      begin
        Fail[U] := Go[FV * 26 + C];
        Order[Tail] := U;
        Inc(Tail);
      end;
    end;
  end;

  ReadLn(Text);
  StripCR(Text);

  State := 0;
  for J := 1 to Length(Text) do
  begin
    C := Ord(Text[J]) - Ord('a');
    if (C < 0) or (C >= 26) then
      Continue;
    State := Go[State * 26 + C];
    Cnt[State] := Cnt[State] + 1;
  end;

  for I := Tail - 1 downto 0 do
  begin
    V := Order[I];
    Cnt[Fail[V]] := Cnt[Fail[V]] + Cnt[V];
  end;

  for I := 0 to N - 1 do
    WriteLn(IntToStr(Cnt[Terminal[I]]));
end.
