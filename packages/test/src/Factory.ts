import { Expose, Injectable } from "#voxer";

interface Translatable {
  translate(x: number, y: number): void;
}

class Vec2 implements Translatable {
  constructor(public x: number, public y: number) {}

  translate(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }
}

class Vec3 extends Vec2 {
  constructor(public x: number, public y: number, public z: number) {
    super(x, y);
  }
}

interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

type Mat4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

const origin: Vec2 = new Vec2(0, 0);

@Injectable()
export class Factory {
  @Expose()
  create(type: any) {
    return new type();
  }

  @Expose()
  createObject(): Object {
    return Object.create(null);
  }

  @Expose()
  createBuffer(): Buffer {
    return Buffer.allocUnsafe(1000);
  }

  @Expose()
  createDate(): Date {
    return new Date();
  }

  @Expose()
  getOrigin(): typeof origin {
    return origin;
  }

  @Expose()
  createVec2() {
    return new Vec2(1, 2);
  }

  @Expose()
  createVec3(): Vec3 {
    return new Vec3(10, 20, 30);
  }

  @Expose()
  createAsVec3() {
    return new Vec3(11, 22, 33);
  }

  @Expose()
  createVec4(): Vec4 {
    return { x: 0, y: 1, z: 2, w: 3 };
  }

  @Expose()
  createAsVec4() {
    return { x: 0, y: 1, z: 2, w: 3 } as Vec4;
  }

  @Expose()
  createMat4(): Mat4 {
    return [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
  }

  @Expose()
  createAsMat4() {
    return [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ] as Mat4;
  }
}
