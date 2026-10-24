{ Educational reference implementation: Pascal is not a USACO submission language. }
program BerlekampMasseyProgram;
{$mode objfpc}{$H+}
{$I-}

uses SysUtils;

const
  MODULO = 1000000007;

type
  TNumberArray = array of Int64;

{ The product of two residues is below 10^18, which is not exact in the
  JavaScript runtime behind pas2js. Splitting one factor at 2^15 keeps every
  intermediate product below 2^53. }
function MulMod(A, B: Int64): Int64;
var
  LowPart, HighPart, LowProduct, HighProduct: Int64;
begin
  LowPart := B mod 32768;
  HighPart := B div 32768;
  LowProduct := (A * LowPart) mod MODULO;
  HighProduct := (A * HighPart) mod MODULO;
  HighProduct := (HighProduct * 32768) mod MODULO;
  MulMod := (LowProduct + HighProduct) mod MODULO;
end;

function PowMod(Base, Exponent: Int64): Int64;
var
  Accumulated, Current: Int64;
begin
  Accumulated := 1;
  Current := Base mod MODULO;
  while Exponent > 0 do
  begin
    if (Exponent and 1) = 1 then
      Accumulated := MulMod(Accumulated, Current);
    Current := MulMod(Current, Current);
    Exponent := Exponent shr 1;
  end;
  PowMod := Accumulated;
end;

procedure Run;
var
  N, I, J, Order, Shift: Integer;
  Discrepancy, Coefficient, LastDiscrepancy: Int64;
  Sequence, Current, Backup, Saved: TNumberArray;
begin
  N := 0;
  Read(N);
  if N <= 0 then
    Exit;

  SetLength(Sequence, N);
  for I := 0 to N - 1 do
  begin
    Sequence[I] := 0;
    Read(Sequence[I]);
    Sequence[I] := Sequence[I] mod MODULO;
  end;

  SetLength(Current, 1);
  Current[0] := 1;
  SetLength(Backup, 1);
  Backup[0] := 1;
  Order := 0;
  Shift := 1;
  LastDiscrepancy := 1;

  for I := 0 to N - 1 do
  begin
    Discrepancy := 0;
    J := 0;
    while (J <= Order) and (J <= I) do
    begin
      Discrepancy := (Discrepancy + MulMod(Current[J], Sequence[I - J])) mod MODULO;
      J := J + 1;
    end;
    if Discrepancy = 0 then
    begin
      Shift := Shift + 1;
      Continue;
    end;

    Saved := Copy(Current, 0, Length(Current));
    Coefficient := MulMod(Discrepancy, PowMod(LastDiscrepancy, MODULO - 2));
    if Length(Current) < Length(Backup) + Shift then
      SetLength(Current, Length(Backup) + Shift);
    for J := 0 to Length(Backup) - 1 do
      Current[J + Shift] :=
        (Current[J + Shift] - MulMod(Coefficient, Backup[J]) + MODULO) mod MODULO;

    if 2 * Order <= I then
    begin
      Order := I + 1 - Order;
      Backup := Saved;
      LastDiscrepancy := Discrepancy;
      Shift := 1;
    end
    else
      Shift := Shift + 1;
  end;

  Discrepancy := 0;
  J := 1;
  while (J <= Order) and (J <= N) do
  begin
    Discrepancy := (Discrepancy + MulMod(Current[J], Sequence[N - J])) mod MODULO;
    J := J + 1;
  end;
  if Discrepancy <> 0 then
    Discrepancy := MODULO - Discrepancy;

  WriteLn(IntToStr(Order) + ' ' + IntToStr(Discrepancy));
end;

begin
  Run;
end.
