{ Educational reference implementation: JavaScript/Pascal is not a USACO submission language. }
program RangeHashing;

{ Each fingerprint is four 16-bit limbs, low limb first, so the arithmetic is
  exactly modulo 2^64 even where QWord is represented as a double. }

const
  LimbMask = 65535;

type
  TFingerprint = array[0..3] of Int64;

const
  BaseLimbs: TFingerprint = (38707, 13906, 0, 0); { 911382323 = 13906 * 65536 + 38707 }

var
  n, q, i, length: Integer;
  l1, r1, l2, r2: Integer;
  value: Int64;
  first, second: TFingerprint;
  prefix, power: array of TFingerprint;

function Small(value: Int64): TFingerprint;
begin
  Result[0] := value and LimbMask;
  Result[1] := (value shr 16) and LimbMask;
  Result[2] := 0;
  Result[3] := 0;
end;

function Multiply(const a, b: TFingerprint): TFingerprint;
var
  row, column: Integer;
  sum, carry: Int64;
begin
  carry := 0;
  for row := 0 to 3 do
  begin
    sum := carry;
    for column := 0 to row do
      sum := sum + a[row - column] * b[column];
    Result[row] := sum and LimbMask;
    carry := sum shr 16;
  end;
end;

function AddValue(const a: TFingerprint; value: Int64): TFingerprint;
var
  row: Integer;
  sum, carry: Int64;
begin
  if value >= 0 then
  begin
    carry := value;
    for row := 0 to 3 do
    begin
      sum := a[row] + (carry and LimbMask);
      Result[row] := sum and LimbMask;
      carry := (carry shr 16) + (sum shr 16);
    end;
  end
  else
  begin
    carry := 0;
    value := -value;
    for row := 0 to 3 do
    begin
      sum := a[row] - ((value shr (16 * row)) and LimbMask) - carry;
      if sum < 0 then
      begin
        sum := sum + 65536;
        carry := 1;
      end
      else
        carry := 0;
      Result[row] := sum;
    end;
  end;
end;

function Subtract(const a, b: TFingerprint): TFingerprint;
var
  row: Integer;
  difference, borrow: Int64;
begin
  borrow := 0;
  for row := 0 to 3 do
  begin
    difference := a[row] - b[row] - borrow;
    if difference < 0 then
    begin
      difference := difference + 65536;
      borrow := 1;
    end
    else
      borrow := 0;
    Result[row] := difference;
  end;
end;

function Same(const a, b: TFingerprint): Boolean;
var
  row: Integer;
begin
  for row := 0 to 3 do
    if a[row] <> b[row] then
      Exit(False);
  Same := True;
end;

begin
  Read(n);
  SetLength(prefix, NativeInt(n + 1));
  SetLength(power, NativeInt(n + 1));
  prefix[0] := Small(0);
  power[0] := Small(1);

  for i := 1 to n do
  begin
    Read(value);
    prefix[i] := AddValue(Multiply(prefix[i - 1], BaseLimbs), value);
    power[i] := Multiply(power[i - 1], BaseLimbs);
  end;

  Read(q);
  for i := 1 to q do
  begin
    Read(l1);
    Read(r1);
    Read(l2);
    Read(r2);
    if r1 - l1 <> r2 - l2 then
      Writeln('NO')
    else
    begin
      length := r1 - l1 + 1;
      first := Subtract(prefix[r1], Multiply(prefix[l1 - 1], power[length]));
      second := Subtract(prefix[r2], Multiply(prefix[l2 - 1], power[length]));
      if Same(first, second) then
        Writeln('YES')
      else
        Writeln('NO');
    end;
  end;
end.
