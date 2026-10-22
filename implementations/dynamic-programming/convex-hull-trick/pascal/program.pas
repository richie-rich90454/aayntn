program ConvexHullProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  TInt64Array = array of Int64;

  { A monotone convex hull trick over the lines y = m * x + b: the lines are
    added with a non-decreasing slope, the queries arrive with a
    non-decreasing x, and the answer is the smallest value of the lines added
    so far.

    The hull is a stack of lines with increasing slopes. The line on top of
    the stack is the one that is smallest for the smallest x, and a query walks
    down the stack as the x grows.

    Ownership: the constructor allocates the arrays and the destructor releases
    them, so the caller owns the instance and must free it exactly once. }
  TConvexHull = class
  private
    FSlope: TInt64Array;
    FIntercept: TInt64Array;
    FSize: Integer;
    function Redundant(M1, B1, M2, B2, M3, B3: Int64): Boolean;
  public
    constructor Create(Capacity: Integer);
    destructor Destroy; override;
    procedure Add(M, B: Int64);
    function Query(X: Int64): Int64;
  end;

{ True when the middle line of the three never holds the minimum: the switch
  points of the neighbours have to decrease along the stack, and the
  comparison is done on the switch points, so the products of the coefficients
  never enter the arithmetic. }
function TConvexHull.Redundant(M1, B1, M2, B2, M3, B3: Int64): Boolean;
begin
  Result := Double(B1 - B2) / Double(M2 - M1) <=
            Double(B2 - B3) / Double(M3 - M2);
end;

constructor TConvexHull.Create(Capacity: Integer);
begin
  inherited Create;
  if Capacity < 1 then
    Capacity := 1;
  SetLength(FSlope, Capacity);
  SetLength(FIntercept, Capacity);
  FSize := 0;
end;

destructor TConvexHull.Destroy;
begin
  SetLength(FSlope, 0);
  SetLength(FIntercept, 0);
  inherited Destroy;
end;

{ Adds the line y = m * x + b. The slope must not be smaller than the slope
  of the line added before, which is what makes the amortised cost of the
  operations constant. }
procedure TConvexHull.Add(M, B: Int64);
begin
  while (FSize > 0) and (FSlope[FSize - 1] = M) do
  begin
    if FIntercept[FSize - 1] <= B then
      Exit;  { the new line is never the smallest, so it is dropped }
    { the new line wins against the line with the same slope }
    Dec(FSize);
  end;
  while (FSize >= 2) and
        Redundant(FSlope[FSize - 2], FIntercept[FSize - 2],
                  FSlope[FSize - 1], FIntercept[FSize - 1], M, B) do
    Dec(FSize);  { the line on top of the stack is never the smallest }
  if FSize = Length(FSlope) then
  begin
    SetLength(FSlope, 2 * FSize);
    SetLength(FIntercept, 2 * FSize);
  end;
  FSlope[FSize] := M;
  FIntercept[FSize] := B;
  Inc(FSize);
end;

{ The smallest value of the lines added so far at the point x. The x values
  must not decrease, which is what lets the query drop the lines it walks
  past. The answer of a query with no line at all is 0. }
function TConvexHull.Query(X: Int64): Int64;
var
  Top: Int64;
  Below: Int64;
begin
  if FSize = 0 then
  begin
    Result := 0;
    Exit;
  end;
  while FSize >= 2 do
  begin
    Top := FSlope[FSize - 1] * X + FIntercept[FSize - 1];
    Below := FSlope[FSize - 2] * X + FIntercept[FSize - 2];
    if Below >= Top then
      Break;
    { The line on top of the stack has the larger slope, so it stays the worse
      of the two for every larger x and is dropped for good. }
    Dec(FSize);
  end;
  Result := FSlope[FSize - 1] * X + FIntercept[FSize - 1];
end;

var
  N: Integer;
  Q: Integer;
  I: Integer;
  M: Int64;
  B: Int64;
  X: Int64;
  Hull: TConvexHull;
begin
  { The input is exactly the contract: n, q, the n lines and the q queries. }
  N := 0;
  Read(N);
  Q := 0;
  Read(Q);

  Hull := TConvexHull.Create(N);

  for I := 0 to N - 1 do
  begin
    M := 0;
    B := 0;
    Read(M);
    Read(B);
    Hull.Add(M, B);
  end;

  for I := 0 to Q - 1 do
  begin
    X := 0;
    Read(X);
    WriteLn(IntToStr(Hull.Query(X)));
  end;

  Hull.Free;
end.
