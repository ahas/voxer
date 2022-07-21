import { Expose, Injectable } from "#app";

@Injectable()
export class Sub {
    @Expose()
    sub() {
        console.log("this is sub");
    }
}