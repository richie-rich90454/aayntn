{ Educational reference implementation: Pascal is not a USACO submission language. }
program SuffixArrayPalindromeProgram;
{$mode objfpc}{$H+}

uses SysUtils;

type
  TIntArray = array of LongInt;

var
  S: string;
  U: string;
  SLen: LongInt;
  N: LongInt;
  SA: TIntArray;
  RankArr: TIntArray;
  Tmp: TIntArray;
  Y: TIntArray;
  Cnt: TIntArray;
  CntChar: array[0..255] of LongInt;
  Lcp: TIntArray;
  Lg: TIntArray;
  St: TIntArray;

{ Removes the carriage return that a CRLF input leaves at the end of a line. }
procedure StripCR(var Value: string);
begin
  while (Length(Value) > 0) and (Value[Length(Value)] = #13) do
    SetLength(Value, Length(Value) - 1);
end;

procedure BuildSuffixArray;
var
  I, K, P, Classes, A, B, A2, B2, C: LongInt;
begin
  SetLength(SA, N);
  SetLength(RankArr, N);
  SetLength(Tmp, N);
  SetLength(Y, N);
  SetLength(Cnt, N);

  for I := 0 to 255 do
    CntChar[I] := 0;
  for I := 0 to N - 1 do
    Inc(CntChar[Ord(U[I + 1])]);
  for I := 1 to 255 do
    Inc(CntChar[I], CntChar[I - 1]);
  for I := N - 1 downto 0 do
  begin
    C := Ord(U[I + 1]);
    Dec(CntChar[C]);
    SA[CntChar[C]] := I;
  end;

  Classes := 0;
  RankArr[SA[0]] := 0;
  for I := 1 to N - 1 do
  begin
    if U[SA[I] + 1] <> U[SA[I - 1] + 1] then
      Inc(Classes);
    RankArr[SA[I]] := Classes;
  end;

  K := 1;
  while (K < N) and (Classes < N - 1) do
  begin
    P := 0;
    for I := N - K to N - 1 do
    begin
      Y[P] := I;
      Inc(P);
    end;
    for I := 0 to N - 1 do
      if SA[I] >= K then
      begin
        Y[P] := SA[I] - K;
        Inc(P);
      end;

    for I := 0 to Classes do
      Cnt[I] := 0;
    for I := 0 to N - 1 do
      Inc(Cnt[RankArr[I]]);
    for I := 1 to Classes do
      Inc(Cnt[I], Cnt[I - 1]);
    for I := N - 1 downto 0 do
    begin
      C := Y[I];
      Dec(Cnt[RankArr[C]]);
      SA[Cnt[RankArr[C]]] := C;
    end;

    for I := 0 to N - 1 do
      Tmp[I] := RankArr[I];
    Classes := 0;
    RankArr[SA[0]] := 0;
    for I := 1 to N - 1 do
    begin
      A := SA[I - 1];
      B := SA[I];
      A2 := -1;
      B2 := -1;
      if A + K < N then
        A2 := Tmp[A + K];
      if B + K < N then
        B2 := Tmp[B + K];
      if (Tmp[A] <> Tmp[B]) or (A2 <> B2) then
        Inc(Classes);
      RankArr[B] := Classes;
    end;

    K := K * 2;
  end;

  for I := 0 to N - 1 do
    RankArr[SA[I]] := I;
end;

procedure BuildLcp;
var
  I, J, R, H: LongInt;
begin
  SetLength(Lcp, N);
  Lcp[0] := 0;
  H := 0;
  for I := 0 to N - 1 do
  begin
    R := RankArr[I];
    if R = 0 then
      H := 0
    else
    begin
      J := SA[R - 1];
      while (I + H < N) and (J + H < N) and (U[I + H + 1] = U[J + H + 1]) do
        Inc(H);
      Lcp[R] := H;
      if H > 0 then
        Dec(H);
    end;
  end;
end;

procedure BuildSparseTable;
var
  I, J, Levels, Span, Limit, Base, Prev, A, B: LongInt;
begin
  SetLength(Lg, N + 1);
  Lg[1] := 0;
  for I := 2 to N do
    Lg[I] := Lg[I div 2] + 1;
  Levels := Lg[N] + 1;

  SetLength(St, Levels * N);
  for I := 0 to N - 1 do
    St[I] := Lcp[I];
  for J := 1 to Levels - 1 do
  begin
    Span := 1 shl (J - 1);
    Limit := N - (1 shl J) + 1;
    Base := J * N;
    Prev := (J - 1) * N;
    for I := 0 to Limit - 1 do
    begin
      A := St[Prev + I];
      B := St[Prev + I + Span];
      if A < B then
        St[Base + I] := A
      else
        St[Base + I] := B;
    end;
  end;
end;

function LcpQuery(I, J: LongInt): LongInt;
var
  A, B, Len, K, X, Y2: LongInt;
begin
  if I = J then
  begin
    LcpQuery := N - I;
    Exit;
  end;
  A := RankArr[I];
  B := RankArr[J];
  if A > B then
  begin
    K := A;
    A := B;
    B := K;
  end;
  Inc(A);
  Len := B - A + 1;
  K := Lg[Len];
  X := St[K * N + A];
  Y2 := St[K * N + B - (1 shl K) + 1];
  if X < Y2 then
    LcpQuery := X
  else
    LcpQuery := Y2;
end;

var
  I, C, Radius, Lo, Hi, Mid, Len, Start, BestLen, BestStart: LongInt;

begin
  ReadLn(S);
  StripCR(S);
  SLen := Length(S);
  if SLen = 0 then
  begin
    WriteLn(0);
    WriteLn(0);
    Exit;
  end;

  N := 2 * SLen + 1;
  SetLength(U, N);
  for I := 1 to SLen do
    U[I] := S[I];
  U[SLen + 1] := '#';
  for I := 1 to SLen do
    U[SLen + 1 + I] := S[SLen - I + 1];

  BuildSuffixArray;
  BuildLcp;
  BuildSparseTable;

  BestLen := 0;
  BestStart := 0;

  for C := 0 to SLen - 1 do
  begin
    Radius := C;
    if SLen - 1 - C < Radius then
      Radius := SLen - 1 - C;
    Lo := 0;
    Hi := Radius;
    while Lo < Hi do
    begin
      Mid := (Lo + Hi + 1) div 2;
      if LcpQuery(C, 2 * SLen - C) >= Mid + 1 then
        Lo := Mid
      else
        Hi := Mid - 1;
    end;
    Len := 2 * Lo + 1;
    Start := C - Lo;
    if (Len > BestLen) or ((Len = BestLen) and (Start < BestStart)) then
    begin
      BestLen := Len;
      BestStart := Start;
    end;
  end;

  for C := 1 to SLen - 1 do
  begin
    Radius := C;
    if SLen - C < Radius then
      Radius := SLen - C;
    Lo := 0;
    Hi := Radius;
    while Lo < Hi do
    begin
      Mid := (Lo + Hi + 1) div 2;
      if LcpQuery(C, 2 * SLen + 1 - C) >= Mid then
        Lo := Mid
      else
        Hi := Mid - 1;
    end;
    Len := 2 * Lo;
    Start := C - Lo;
    if (Len > BestLen) or ((Len = BestLen) and (Start < BestStart)) then
    begin
      BestLen := Len;
      BestStart := Start;
    end;
  end;

  WriteLn(BestLen);
  WriteLn(BestStart);
end.
