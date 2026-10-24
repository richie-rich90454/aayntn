{ Educational reference implementation: Pascal is not a USACO submission language. }
program MillerRabinProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  BaseCount = 12;
  Bases: array[0..BaseCount - 1] of LongWord = (2, 3, 5, 7, 11, 13, 17, 19, 23,
    29, 31, 37);
  Two32 = 4294967296;

type
  { A non-negative 64-bit integer as two 32-bit limbs. The browser Pascal
    compiler stores Int64 as a double, so the limbs keep every value exact. }
  TU64 = record
    Hi: LongWord;
    Lo: LongWord;
  end;

function MakeU64(Hi, Lo: LongWord): TU64;
begin
  Result.Hi := Hi;
  Result.Lo := Lo;
end;

function IsZero(A: TU64): Boolean;
begin
  Result := (A.Hi = 0) and (A.Lo = 0);
end;

function IsOne(A: TU64): Boolean;
begin
  Result := (A.Hi = 0) and (A.Lo = 1);
end;

function Compare(A, B: TU64): Integer;
begin
  if A.Hi < B.Hi then
    Exit(-1);
  if A.Hi > B.Hi then
    Exit(1);
  if A.Lo < B.Lo then
    Exit(-1);
  if A.Lo > B.Lo then
    Exit(1);
  Result := 0;
end;

function Add(A, B: TU64): TU64;
var
  T: Int64;
  Carry: LongWord;
begin
  T := Int64(A.Lo) + Int64(B.Lo);
  Result.Lo := LongWord(T mod Two32);
  Carry := LongWord(T div Two32);
  T := Int64(A.Hi) + Int64(B.Hi) + Int64(Carry);
  Result.Hi := LongWord(T mod Two32);
end;

function Subtract(A, B: TU64): TU64;
var
  T: Int64;
begin
  if A.Lo >= B.Lo then
  begin
    Result.Lo := A.Lo - B.Lo;
    Result.Hi := A.Hi - B.Hi;
  end
  else
  begin
    T := Int64(A.Lo) + Two32 - Int64(B.Lo);
    Result.Lo := LongWord(T);
    Result.Hi := A.Hi - B.Hi - 1;
  end;
end;

function ShiftRightOne(A: TU64): TU64;
begin
  Result.Lo := LongWord(Int64(A.Lo) div 2 + (A.Hi mod 2) * 2147483648);
  Result.Hi := LongWord(Int64(A.Hi) div 2);
end;

function AddSmall(A: TU64; W: LongWord): TU64;
var
  T: Int64;
begin
  T := Int64(A.Lo) + Int64(W);
  Result.Lo := LongWord(T mod Two32);
  Result.Hi := A.Hi + LongWord(T div Two32);
end;

function MultiplySmall(A: TU64; M: LongWord): TU64;
var
  T: Int64;
  Carry: LongWord;
begin
  T := Int64(A.Lo) * Int64(M);
  Result.Lo := LongWord(T mod Two32);
  Carry := LongWord(T div Two32);
  T := Int64(A.Hi) * Int64(M) + Int64(Carry);
  Result.Hi := LongWord(T mod Two32);
end;

function ModSmall(A: TU64; M: LongWord): LongWord;
var
  T: Int64;
begin
  T := Int64(A.Hi mod M) * Two32 + Int64(A.Lo);
  Result := LongWord(T mod M);
end;

{ (A + B) mod M, where A and B are already below M and M is below 2^63. }
function AddMod(A, B, M: TU64): TU64;
var
  Sum: TU64;
begin
  Sum := Add(A, B);
  if Compare(Sum, M) >= 0 then
    Sum := Subtract(Sum, M);
  Result := Sum;
end;

{ (A * B) mod M by doubling, because Free Pascal has no 128-bit integer. }
function MulMod(A, B, M: TU64): TU64;
var
  Res: TU64;
  Cur: TU64;
begin
  Res := MakeU64(0, 0);
  Cur := A;
  while not IsZero(B) do
  begin
    if (B.Lo mod 2) = 1 then
      Res := AddMod(Res, Cur, M);
    Cur := AddMod(Cur, Cur, M);
    B := ShiftRightOne(B);
  end;
  MulMod := Res;
end;

function PowMod(A, E, M: TU64): TU64;
var
  Res: TU64;
  Base: TU64;
begin
  Res := MakeU64(0, 1);
  Base := A;
  while not IsZero(E) do
  begin
    if (E.Lo mod 2) = 1 then
      Res := MulMod(Res, Base, M);
    Base := MulMod(Base, Base, M);
    E := ShiftRightOne(E);
  end;
  PowMod := Res;
end;

function ParseU64(const S: string; out Negative: Boolean): TU64;
var
  I: Integer;
  C: Char;
  Value: TU64;
begin
  Value := MakeU64(0, 0);
  Negative := False;
  for I := 1 to Length(S) do
  begin
    C := S[I];
    if C = '-' then
      Negative := True
    else if (C >= '0') and (C <= '9') then
      Value := AddSmall(MultiplySmall(Value, 10), LongWord(Ord(C) - Ord('0')));
  end;
  Result := Value;
end;

function IsPrime(N: TU64): Boolean;
var
  I: Integer;
  R: Integer;
  S: Integer;
  P: LongWord;
  D: TU64;
  X: TU64;
  NMinusOne: TU64;
  Passed: Boolean;
begin
  if (N.Hi = 0) and (N.Lo < 2) then
    Exit(False);

  { Small factors are cheap, and they leave N > 37 and coprime to every base. }
  for I := 0 to BaseCount - 1 do
  begin
    P := Bases[I];
    if ModSmall(N, P) = 0 then
    begin
      Result := (N.Hi = 0) and (N.Lo = P);
      Exit;
    end;
  end;

  { Write N - 1 as 2^S * D with D odd. }
  NMinusOne := Subtract(N, MakeU64(0, 1));
  D := NMinusOne;
  S := 0;
  while (D.Lo mod 2) = 0 do
  begin
    D := ShiftRightOne(D);
    S := S + 1;
  end;

  for I := 0 to BaseCount - 1 do
  begin
    X := PowMod(MakeU64(0, Bases[I]), D, N);
    if IsOne(X) or (Compare(X, NMinusOne) = 0) then
      Continue;
    Passed := False;
    for R := 1 to S - 1 do
    begin
      X := MulMod(X, X, N);
      if Compare(X, NMinusOne) = 0 then
      begin
        Passed := True;
        Break;
      end;
    end;
    if not Passed then
      Exit(False);
  end;
  Result := True;
end;

var
  Count: Int64;
  I: Int64;
  Line: string;
  Negative: Boolean;
  Value: TU64;
begin
  ReadLn(Count);
  for I := 1 to Count do
  begin
    ReadLn(Line);
    Value := ParseU64(Line, Negative);
    if Negative or ((Value.Hi = 0) and (Value.Lo < 2)) then
      WriteLn('COMPOSITE')
    else if IsPrime(Value) then
      WriteLn('PRIME')
    else
      WriteLn('COMPOSITE');
  end;
end.
