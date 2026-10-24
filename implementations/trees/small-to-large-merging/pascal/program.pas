program SmallToLargeProgram;
{$mode objfpc}{$H+}
{$I-}
{ Educational reference implementation: Pascal is not a USACO submission
  language. }

uses SysUtils;

type
  { A hash set of nonnegative colors, with open addressing and linear probing.
    The value -1 marks an empty slot, so every color must be nonnegative. }
  TIntSet = class
  private
    FSlots: array of Integer;
    FCapacity: Integer;
    FSize: Integer;
    function SlotFor(Value, Capacity: Integer): Integer;
    procedure Grow;
  public
    constructor Create;
    destructor Destroy; override;
    function Insert(Value: Integer): Boolean;
    procedure Merge(Other: TIntSet);
    property Size: Integer read FSize;
  end;

constructor TIntSet.Create;
var
  I: Integer;
begin
  inherited Create;
  FCapacity := 8;
  FSize := 0;
  SetLength(FSlots, FCapacity);
  for I := 0 to FCapacity - 1 do
    FSlots[I] := -1;
end;

destructor TIntSet.Destroy;
begin
  SetLength(FSlots, 0);
  inherited Destroy;
end;

function TIntSet.SlotFor(Value, Capacity: Integer): Integer;
var
  X: LongWord;
begin
  X := LongWord(Value);
  X := X xor (X shr 16);
  X := X * LongWord($7FEB352D);
  X := X xor (X shr 15);
  Result := Integer(X and LongWord(Capacity - 1));
end;

procedure TIntSet.Grow;
var
  NewCapacity: Integer;
  Fresh: array of Integer;
  I: Integer;
  Position: Integer;
begin
  NewCapacity := FCapacity * 2;
  SetLength(Fresh, NewCapacity);
  for I := 0 to NewCapacity - 1 do
    Fresh[I] := -1;
  for I := 0 to FCapacity - 1 do
    if FSlots[I] <> -1 then
    begin
      Position := SlotFor(FSlots[I], NewCapacity);
      while Fresh[Position] <> -1 do
        Position := (Position + 1) and (NewCapacity - 1);
      Fresh[Position] := FSlots[I];
    end;
  FSlots := Fresh;
  FCapacity := NewCapacity;
end;

function TIntSet.Insert(Value: Integer): Boolean;
var
  Position: Integer;
begin
  if (FSize + 1) * 10 >= FCapacity * 7 then
    Grow;
  Position := SlotFor(Value, FCapacity);
  while FSlots[Position] <> -1 do
  begin
    if FSlots[Position] = Value then
    begin
      Result := False;
      Exit;
    end;
    Position := (Position + 1) and (FCapacity - 1);
  end;
  FSlots[Position] := Value;
  Inc(FSize);
  Result := True;
end;

procedure TIntSet.Merge(Other: TIntSet);
var
  I: Integer;
begin
  for I := 0 to Other.FCapacity - 1 do
    if Other.FSlots[I] <> -1 then
      Insert(Other.FSlots[I]);
end;

var
  N: Integer;
  I: Integer;
  V: Integer;
  P: Integer;
  Colors: array of Integer;
  Parents: array of Integer;
  Answer: array of Integer;
  Weights: array of Integer;
  Sets: array of TIntSet;
  SetSwap: TIntSet;
  WeightSwap: Integer;

begin
  N := 0;
  Read(N);
  if N > 0 then
  begin
    SetLength(Colors, N);
    for I := 0 to N - 1 do
      Read(Colors[I]);

    SetLength(Parents, N);
    Parents[0] := -1;
    for I := 1 to N - 1 do
    begin
      P := 0;
      Read(P);
      { The contract numbers parents before children; a bad index falls back
        to the root. }
      if (P < 0) or (P >= I) then
        P := 0;
      Parents[I] := P;
    end;

    SetLength(Sets, N);
    SetLength(Answer, N);
    SetLength(Weights, N);
    for I := 0 to N - 1 do
    begin
      Sets[I] := TIntSet.Create;
      Sets[I].Insert(Colors[I]);
      Answer[I] := 1;
      Weights[I] := 1;
    end;

    { Every child has a larger index than its parent, so this reverse sweep is
      a postorder: when V is reached, all of its children are already in its
      set. }
    for V := N - 1 downto 1 do
    begin
      Answer[V] := Sets[V].Size;
      P := Parents[V];
      { Keep the larger live component as the base and pour the smaller one
        into it. The weight counts the vertices the component represents, so
        the component that holds a moved element at least doubles. }
      if Weights[P] < Weights[V] then
      begin
        SetSwap := Sets[P];
        Sets[P] := Sets[V];
        Sets[V] := SetSwap;
        WeightSwap := Weights[P];
        Weights[P] := Weights[V];
        Weights[V] := WeightSwap;
      end;
      Sets[P].Merge(Sets[V]);
      Weights[P] := Weights[P] + Weights[V];
      Sets[V].Free;
      Sets[V] := nil;
    end;
    Answer[0] := Sets[0].Size;

    for I := 0 to N - 1 do
      WriteLn(Answer[I]);

    Sets[0].Free;
  end;
end.
