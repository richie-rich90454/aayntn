{ Educational reference implementation: Pascal is not a USACO submission language. }
program PollardRho;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  SmallCount = 12;
  SmallPrimes: array[0..SmallCount - 1] of Int64 = (2, 3, 5, 7, 11, 13, 17, 19, 23,
    29, 31, 37);
  Two31 = 2147483648;
  Two32 = 4294967296;
  MaxFactors = 128;
  Pow2: array[0..31] of Int64 = (1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024,
    2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576,
    2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728,
    268435456, 536870912, 1073741824, 2147483648);

type
  { A non-negative 64-bit integer as two limbs, each in [0, 2^32). The browser
    Pascal compiler stores Int64 as a double, so every limb stays below 2^32,
    where a double is exact, and no 128-bit type is needed. }
  TU64 = record
    Hi: Int64;
    Lo: Int64;
  end;

  TFactorList = array[0..MaxFactors - 1] of TU64;

function MakeU64(Hi, Lo: Int64): TU64;
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
  T, Carry: Int64;
begin
  T := A.Lo + B.Lo;
  Result.Lo := T mod Two32;
  Carry := T div Two32;
  T := A.Hi + B.Hi + Carry;
  Result.Hi := T mod Two32;
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
    T := A.Lo + Two32 - B.Lo;
    Result.Lo := T;
    Result.Hi := A.Hi - B.Hi - 1;
  end;
end;

function ShiftRightOne(A: TU64): TU64;
begin
  Result.Lo := A.Lo div 2 + (A.Hi mod 2) * Two31;
  Result.Hi := A.Hi div 2;
end;

function ShiftLeftOne(A: TU64): TU64;
begin
  Result.Hi := (A.Hi * 2 + A.Lo div Two31) mod Two32;
  Result.Lo := (A.Lo mod Two31) * 2;
end;

function BitAt(A: TU64; Index: Integer): Int64;
var
  V: Int64;
begin
  if Index >= 32 then
  begin
    V := A.Hi;
    Index := Index - 32;
  end
  else
    V := A.Lo;
  Result := (V div Pow2[Index]) mod 2;
end;

function AddSmall(A: TU64; W: Int64): TU64;
var
  T: Int64;
begin
  T := A.Lo + W;
  Result.Lo := T mod Two32;
  Result.Hi := A.Hi + T div Two32;
end;

function MultiplySmall(A: TU64; M: Int64): TU64;
var
  T, Carry: Int64;
begin
  T := A.Lo * M;
  Result.Lo := T mod Two32;
  Carry := T div Two32;
  T := A.Hi * M + Carry;
  Result.Hi := T mod Two32;
end;

function DivSmall(A: TU64; D: Int64; out R: Int64): TU64;
var
  QHi, QLo, Rem, T: Int64;
begin
  QHi := A.Hi div D;
  Rem := A.Hi mod D;
  T := Rem * Two32 + A.Lo;
  QLo := T div D;
  R := T mod D;
  Result := MakeU64(QHi, QLo);
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

{ (A * B) mod M by doubling, because pas2js has no 128-bit integer. }
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

{ A div B and A mod B by binary long division. }
function DivModU64(A, B: TU64; out R: TU64): TU64;
var
  Q, Rem: TU64;
  I: Integer;
begin
  Q := MakeU64(0, 0);
  Rem := MakeU64(0, 0);
  for I := 63 downto 0 do
  begin
    Rem := ShiftLeftOne(Rem);
    if BitAt(A, I) = 1 then
      Rem.Lo := Rem.Lo + 1;
    Q := ShiftLeftOne(Q);
    if Compare(Rem, B) >= 0 then
    begin
      Rem := Subtract(Rem, B);
      Q.Lo := Q.Lo + 1;
    end;
  end;
  R := Rem;
  Result := Q;
end;

function ModU64(A, B: TU64): TU64;
var
  R: TU64;
begin
  DivModU64(A, B, R);
  Result := R;
end;

function GcdU64(A, B: TU64): TU64;
var
  R: TU64;
begin
  while not IsZero(B) do
  begin
    R := ModU64(A, B);
    A := B;
    B := R;
  end;
  Result := A;
end;

function IsPrime(N: TU64): Boolean;
var
  I, R, S: Integer;
  P: Int64;
  D, X, NMinusOne: TU64;
  Passed: Boolean;
begin
  if (N.Hi = 0) and (N.Lo < 2) then
    Exit(False);

  for I := 0 to SmallCount - 1 do
  begin
    P := SmallPrimes[I];
    if IsZero(ModU64(N, MakeU64(0, P))) then
    begin
      Result := (N.Hi = 0) and (N.Lo = P);
      Exit;
    end;
  end;

  NMinusOne := Subtract(N, MakeU64(0, 1));
  D := NMinusOne;
  S := 0;
  while (D.Lo mod 2) = 0 do
  begin
    D := ShiftRightOne(D);
    S := S + 1;
  end;

  for I := 0 to SmallCount - 1 do
  begin
    X := PowMod(MakeU64(0, SmallPrimes[I]), D, N);
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

{ One step of f(X) = X^2 + C modulo N, with C reduced first. }
function RhoStep(X: TU64; C: Int64; N: TU64): TU64;
var
  R, Add: TU64;
begin
  R := MulMod(X, X, N);
  Add := MakeU64(0, C);
  if Compare(Add, N) >= 0 then
    Add := ModU64(Add, N);
  Result := AddMod(R, Add, N);
end;

function Pollard(N: TU64): TU64;
var
  C: Int64;
  X, Y, D, Diff: TU64;
begin
  if (N.Hi = 0) and ((N.Lo mod 2) = 0) then
    Exit(MakeU64(0, 2));
  if (N.Hi = 0) and ((N.Lo mod 3) = 0) then
    Exit(MakeU64(0, 3));

  C := 1;
  while True do
  begin
    X := MakeU64(0, 2);
    Y := X;
    D := MakeU64(0, 1);
    while IsOne(D) do
    begin
      X := RhoStep(X, C, N);
      Y := RhoStep(RhoStep(Y, C, N), C, N);
      if Compare(X, Y) >= 0 then
        Diff := Subtract(X, Y)
      else
        Diff := Subtract(Y, X);
      D := GcdU64(Diff, N);
    end;
    if Compare(D, N) <> 0 then
      Exit(D);
    Inc(C);
  end;
end;

procedure Factorize(Value: TU64; var Factors: TFactorList; var FactorCount: Integer);
var
  Stack: TFactorList;
  StackTop, I, J, PIndex: Integer;
  P, M, D, Quotient, R: TU64;
  Rem: Int64;
  Temp: TU64;
begin
  FactorCount := 0;
  StackTop := 0;

  if Compare(Value, MakeU64(0, 1)) <= 0 then
    Exit;

  for PIndex := 0 to SmallCount - 1 do
  begin
    P := MakeU64(0, SmallPrimes[PIndex]);
    while IsZero(ModU64(Value, P)) do
    begin
      Factors[FactorCount] := P;
      Inc(FactorCount);
      Value := DivSmall(Value, SmallPrimes[PIndex], Rem);
    end;
  end;

  if Compare(Value, MakeU64(0, 1)) > 0 then
  begin
    Stack[StackTop] := Value;
    Inc(StackTop);
  end;

  while StackTop > 0 do
  begin
    Dec(StackTop);
    M := Stack[StackTop];
    if IsPrime(M) then
    begin
      Factors[FactorCount] := M;
      Inc(FactorCount);
    end
    else
    begin
      D := Pollard(M);
      Quotient := DivModU64(M, D, R);
      Stack[StackTop] := D;
      Inc(StackTop);
      Stack[StackTop] := Quotient;
      Inc(StackTop);
    end;
  end;

  for I := 1 to FactorCount - 1 do
  begin
    Temp := Factors[I];
    J := I - 1;
    while (J >= 0) and (Compare(Factors[J], Temp) > 0) do
    begin
      Factors[J + 1] := Factors[J];
      Dec(J);
    end;
    Factors[J + 1] := Temp;
  end;
end;

function ParseU64(const S: string): TU64;
var
  I: Integer;
  C: Char;
  Value: TU64;
begin
  Value := MakeU64(0, 0);
  for I := 1 to Length(S) do
  begin
    C := S[I];
    if (C >= '0') and (C <= '9') then
      Value := AddSmall(MultiplySmall(Value, 10), Ord(C) - Ord('0'));
  end;
  Result := Value;
end;

procedure WriteU64(A: TU64);
var
  Digits: array[0..31] of Char;
  Count, I: Integer;
  R: Int64;
  T: TU64;
begin
  if IsZero(A) then
  begin
    Write('0');
    Exit;
  end;

  Count := 0;
  T := A;
  while not IsZero(T) do
  begin
    T := DivSmall(T, 10, R);
    Digits[Count] := Chr(Ord('0') + Integer(R));
    Inc(Count);
  end;

  for I := Count - 1 downto 0 do
    Write(Digits[I]);
end;

var
  CaseCount, CaseIndex: Int64;
  I, FactorCount: Integer;
  Line: string;
  Value: TU64;
  Factors: TFactorList;
begin
  ReadLn(CaseCount);
  for CaseIndex := 1 to CaseCount do
  begin
    ReadLn(Line);
    Value := ParseU64(Line);
    Factorize(Value, Factors, FactorCount);

    for I := 0 to FactorCount - 1 do
    begin
      if I > 0 then
        Write(' ');
      WriteU64(Factors[I]);
    end;
    WriteLn;
  end;
end.
